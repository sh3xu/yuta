use std::collections::{HashMap, HashSet, VecDeque};
use std::f32::consts::PI;
use std::thread;
use std::time::{Duration, Instant};

use serde::Serialize;
use sysinfo::{Process, ProcessRefreshKind, RefreshKind, System};
use tauri::{AppHandle, Emitter};
use wasapi::{
    initialize_mta, AudioCaptureClient, AudioClient, Device, DeviceEnumerator, Direction, Handle,
    Role, SampleType, SessionState, StreamMode, WaveFormat,
};

const EVENT: &str = "system-audio";
const MEDIA_APPS: &[&str] = &[
    "chrome.exe",
    "msedge.exe",
    "firefox.exe",
    "brave.exe",
    "opera.exe",
    "vivaldi.exe",
    "spotify.exe",
    "vlc.exe",
    "mpv.exe",
    "foobar2000.exe",
    "wmplayer.exe",
    "music.ui.exe",
    "applemusic.exe",
    "itunes.exe",
    "discord.exe",
    "telegram.exe",
];
const BLOCK_FRAMES: usize = 1024;
const START_MS: u64 = 900;
const STOP_MS: u64 = 800;
const START_ENERGY: f32 = 0.12;
const MIN_BEAT_MS: f32 = 280.0;
const MAX_BEAT_MS: f32 = 860.0;
const RESCAN_SILENCE: Duration = Duration::from_secs(8);
const PROBE_MS: u64 = 900;
const HEAR_PEAK: f32 = 0.004;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct SystemAudioFrame {
    playing: bool,
    energy: f32,
    bass: f32,
    mid: f32,
    treble: f32,
    beat_pulse: f32,
    beat_index: u32,
    bpm: f32,
    source: String,
}

struct Analyzer {
    lp_bass: f32,
    lp_mid: f32,
    energy_avg: f32,
    bass_avg: f32,
    prev_bass: f32,
    beat_pulse: f32,
    beat_index: u32,
    last_beat: Option<Instant>,
    bpm: f32,
    intervals: Vec<f32>,
    playing: bool,
    music_since: Option<Instant>,
    quiet_since: Option<Instant>,
    last_emit: Instant,
}

impl Analyzer {
    fn new() -> Self {
        Self {
            lp_bass: 0.0,
            lp_mid: 0.0,
            energy_avg: 0.0,
            bass_avg: 0.0,
            prev_bass: 0.0,
            beat_pulse: 0.0,
            beat_index: 0,
            last_beat: None,
            bpm: 118.0,
            intervals: Vec::new(),
            playing: false,
            music_since: None,
            quiet_since: None,
            last_emit: Instant::now() - Duration::from_secs(1),
        }
    }

    fn ingest(&mut self, mono: &[f32], sample_rate: f32) -> Option<SystemAudioFrame> {
        if mono.is_empty() || sample_rate < 1.0 {
            return None;
        }

        let a_bass = 1.0 - (-2.0 * PI * 140.0 / sample_rate).exp();
        let a_mid = 1.0 - (-2.0 * PI * 2000.0 / sample_rate).exp();
        let mut energy_sq = 0.0;
        let mut bass_sq = 0.0;
        let mut mid_sq = 0.0;
        let mut treble_sq = 0.0;

        for &sample in mono {
            self.lp_bass += a_bass * (sample - self.lp_bass);
            self.lp_mid += a_mid * (sample - self.lp_mid);
            let bass = self.lp_bass;
            let mid = self.lp_mid - self.lp_bass;
            let treble = sample - self.lp_mid;
            energy_sq += sample * sample;
            bass_sq += bass * bass;
            mid_sq += mid * mid;
            treble_sq += treble * treble;
        }

        let n = mono.len() as f32;
        let rms = (energy_sq / n).sqrt();
        let bass = (bass_sq / n).sqrt();
        let mid = (mid_sq / n).sqrt();
        let treble = (treble_sq / n).sqrt();

        self.energy_avg = self.energy_avg * 0.82 + rms * 0.18;
        self.bass_avg = self.bass_avg * 0.86 + bass * 0.14;

        let energy = (self.energy_avg * 7.5).clamp(0.0, 1.0);
        let bass_n = (bass * 8.0).clamp(0.0, 1.0);
        let mid_n = (mid * 7.0).clamp(0.0, 1.0);
        let treble_n = (treble * 6.5).clamp(0.0, 1.0);

        let flux = (bass_n - self.prev_bass).max(0.0);
        self.prev_bass = bass_n;
        let threshold = self.bass_avg.max(0.012) * 1.35;
        if flux > threshold && energy > 0.08 && bass_n > 0.08 {
            self.register_beat();
        }
        self.beat_pulse *= 0.78;

        let now = Instant::now();
        if self
            .last_beat
            .is_some_and(|at| now.duration_since(at) > Duration::from_millis(1400))
        {
            self.intervals.clear();
        }

        let musical = self.is_music(energy, bass_n, mid_n, treble_n);
        if musical {
            self.quiet_since = None;
            let started = *self.music_since.get_or_insert(now);
            if !self.playing && now.duration_since(started).as_millis() as u64 >= START_MS {
                self.playing = true;
            }
        } else {
            self.music_since = None;
            let quiet = *self.quiet_since.get_or_insert(now);
            if self.playing && now.duration_since(quiet).as_millis() as u64 >= STOP_MS {
                self.playing = false;
                self.beat_pulse = 0.0;
            }
        }

        if now.duration_since(self.last_emit) < Duration::from_millis(40) {
            return None;
        }
        self.last_emit = now;

        Some(SystemAudioFrame {
            playing: self.playing,
            energy: if self.playing { energy } else { 0.0 },
            bass: if self.playing { bass_n } else { 0.0 },
            mid: if self.playing { mid_n } else { 0.0 },
            treble: if self.playing { treble_n } else { 0.0 },
            beat_pulse: if self.playing {
                self.beat_pulse.clamp(0.0, 1.0)
            } else {
                0.0
            },
            beat_index: self.beat_index,
            bpm: self.bpm,
            source: String::new(),
        })
    }

    fn register_beat(&mut self) {
        let now = Instant::now();
        if let Some(prev) = self.last_beat {
            let gap = now.duration_since(prev).as_secs_f32() * 1000.0;
            if gap < MIN_BEAT_MS {
                return;
            }
            if (MIN_BEAT_MS..=MAX_BEAT_MS).contains(&gap) {
                self.intervals.push(gap);
                if self.intervals.len() > 10 {
                    self.intervals.remove(0);
                }
                let mut sorted = self.intervals.clone();
                sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
                let median = sorted[sorted.len() / 2];
                if median > 0.0 {
                    self.bpm = self.bpm * 0.65 + (60000.0 / median) * 0.35;
                }
            }
        }
        self.last_beat = Some(now);
        self.beat_index += 1;
        self.beat_pulse = 1.0;
    }

    fn beat_regularity(&self) -> f32 {
        if self.intervals.len() < 4 {
            return 0.0;
        }
        let n = self.intervals.len() as f32;
        let mean = self.intervals.iter().sum::<f32>() / n;
        if mean < 1.0 {
            return 0.0;
        }
        let var = self
            .intervals
            .iter()
            .map(|gap| {
                let delta = *gap - mean;
                delta * delta
            })
            .sum::<f32>()
            / n;
        let cv = (var.sqrt() / mean).clamp(0.0, 1.0);
        (1.0 - cv / 0.28).clamp(0.0, 1.0)
    }

    fn is_music(&self, energy: f32, bass: f32, mid: f32, treble: f32) -> bool {
        if energy < START_ENERGY {
            return false;
        }
        let regular = self.beat_regularity();
        if regular < 0.55 || self.intervals.len() < 4 {
            return false;
        }
        let speechy = mid > bass * 1.7 && mid > 0.22 && bass < 0.16 && treble > 0.1 && regular < 0.82;
        if speechy {
            return false;
        }
        bass + mid > 0.18
    }
}

struct CaptureStream {
    _client: AudioClient,
    capture: AudioCaptureClient,
    event: Option<Handle>,
    format: WaveFormat,
    source: String,
}

pub fn run(app: AppHandle) {
    let _ = initialize_mta();
    loop {
        match capture_once(&app) {
            Ok(()) => thread::sleep(Duration::from_millis(250)),
            Err(error) => {
                eprintln!("[yuta] system audio: {error}");
                let _ = app.emit(EVENT, silent_frame());
                thread::sleep(Duration::from_secs(1));
            }
        }
    }
}

fn silent_frame() -> SystemAudioFrame {
    SystemAudioFrame {
        playing: false,
        energy: 0.0,
        bass: 0.0,
        mid: 0.0,
        treble: 0.0,
        beat_pulse: 0.0,
        beat_index: 0,
        bpm: 0.0,
        source: String::new(),
    }
}

fn capture_once(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let stream = open_stream()?;
    eprintln!("[yuta] system audio: listening to {}", stream.source);
    let sample_rate = stream.format.get_samplespersec() as f32;
    let channels = stream.format.get_nchannels().max(1) as usize;
    let blockalign = stream.format.get_blockalign() as usize;
    if stream.format.get_bitspersample() != 32 {
        return Err("audio format is not 32-bit".into());
    }

    let mut queue: VecDeque<u8> = VecDeque::with_capacity(blockalign * BLOCK_FRAMES * 8);
    let mut analyzer = Analyzer::new();
    let min_bytes = 256 * blockalign;
    let mut heard_at = Instant::now();
    let source = stream.source.clone();

    loop {
        if let Some(event) = &stream.event {
            let _ = event.wait_for_event(80);
        } else {
            thread::sleep(Duration::from_millis(8));
        }

        drain_packets(&stream, &mut queue)?;

        while queue.len() >= min_bytes {
            let frames = (queue.len() / blockalign).min(BLOCK_FRAMES);
            let mono = take_mono(&mut queue, frames, channels, blockalign);
            if let Some(mut frame) = analyzer.ingest(&mono, sample_rate) {
                frame.source = source.clone();
                if frame.playing {
                    heard_at = Instant::now();
                }
                let _ = app.emit(EVENT, frame);
            }
        }

        if !analyzer.playing && heard_at.elapsed() > RESCAN_SILENCE {
            return Ok(());
        }
    }
}

fn drain_packets(
    stream: &CaptureStream,
    queue: &mut VecDeque<u8>,
) -> Result<(), Box<dyn std::error::Error>> {
    loop {
        match stream.capture.get_next_packet_size() {
            Ok(Some(0)) | Ok(None) => break,
            Ok(Some(_)) => {
                stream
                    .capture
                    .read_from_device_to_deque(queue)
                    .map_err(|error| format!("read audio: {error}"))?;
            }
            Err(_) => break,
        }
    }
    Ok(())
}

fn open_stream() -> Result<CaptureStream, Box<dyn std::error::Error>> {
    let mut last_error = "no playing app".to_string();
    let mut fallback: Option<(i32, f32, CaptureStream)> = None;

    for (pid, include_tree, label) in media_targets() {
        match start_app_loopback(pid, include_tree, &label) {
            Ok(stream) => {
                let peak = probe(&stream);
                if peak >= HEAR_PEAK {
                    eprintln!("[yuta] system audio: hooked {label} peak={peak:.3}");
                    return Ok(stream);
                }
                let rank = app_rank(&label);
                let better = fallback
                    .as_ref()
                    .map(|(best_rank, best_peak, _)| rank > *best_rank || (rank == *best_rank && peak >= *best_peak))
                    .unwrap_or(true);
                if better {
                    fallback = Some((rank, peak, stream));
                }
            }
            Err(error) => last_error = error,
        }
    }

    if let Some((_, peak, stream)) = fallback {
        eprintln!(
            "[yuta] system audio: listening to {} (probe peak={peak:.3})",
            stream.source
        );
        return Ok(stream);
    }

    if let Ok(enumerator) = DeviceEnumerator::new() {
        for device in render_devices(&enumerator) {
            match start_device_loopback(device) {
                Ok(stream) => {
                    if probe(&stream) >= HEAR_PEAK {
                        return Ok(stream);
                    }
                    last_error = format!("{} silent", stream.source);
                }
                Err(error) => last_error = error,
            }
        }
    }

    Err(last_error.into())
}

fn app_rank(label: &str) -> i32 {
    let stem = process_stem(label.split('#').next().unwrap_or(label));
    match stem.as_str() {
        "spotify" | "vlc" | "mpv" | "foobar2000" | "wmplayer" | "music.ui" | "applemusic"
        | "itunes" => 3,
        "chrome" | "msedge" | "firefox" | "brave" | "opera" | "vivaldi" => 2,
        "discord" | "telegram" => 1,
        _ => 0,
    }
}

fn process_format() -> WaveFormat {
    WaveFormat::new(32, 32, &SampleType::Float, 48000, 2, None)
}

fn start_app_loopback(pid: u32, include_tree: bool, label: &str) -> Result<CaptureStream, String> {
    let format = process_format();
    let mut client = AudioClient::new_application_loopback_client(pid, include_tree)
        .map_err(|error| format!("{label}: {error}"))?;
    let mode = StreamMode::EventsShared {
        autoconvert: true,
        buffer_duration_hns: 200_000,
    };
    client
        .initialize_client(&format, &Direction::Capture, &mode)
        .map_err(|error| format!("{label} init: {error}"))?;
    let event = client
        .set_get_eventhandle()
        .map_err(|error| format!("{label} event: {error}"))?;
    let capture = client
        .get_audiocaptureclient()
        .map_err(|error| format!("{label} capture: {error}"))?;
    client
        .start_stream()
        .map_err(|error| format!("{label} start: {error}"))?;
    Ok(CaptureStream {
        _client: client,
        capture,
        event: Some(event),
        format,
        source: label.to_string(),
    })
}

fn start_device_loopback(device: Device) -> Result<CaptureStream, String> {
    let name = device.get_friendlyname().unwrap_or_else(|_| "playback".into());
    let mut client = device
        .get_iaudioclient()
        .map_err(|error| format!("{name}: audio client: {error}"))?;
    let format = client
        .get_mixformat()
        .map_err(|error| format!("{name}: mix format: {error}"))?;
    client
        .initialize_client(
            &format,
            &Direction::Capture,
            &StreamMode::PollingShared {
                autoconvert: false,
                buffer_duration_hns: 1_000_000,
            },
        )
        .map_err(|error| format!("{name}: loopback init: {error}"))?;
    let capture = client
        .get_audiocaptureclient()
        .map_err(|error| format!("{name}: capture client: {error}"))?;
    client
        .start_stream()
        .map_err(|error| format!("{name}: start: {error}"))?;
    Ok(CaptureStream {
        _client: client,
        capture,
        event: None,
        format,
        source: name,
    })
}

fn media_targets() -> Vec<(u32, bool, String)> {
    let mut targets = Vec::new();
    let mut seen = HashSet::new();
    let self_pid = std::process::id();
    let catalog = process_catalog();

    for pid in active_session_pids() {
        let label = catalog
            .iter()
            .find(|proc| proc.pid == pid)
            .map(|proc| format!("{}#{}", proc.name, pid))
            .unwrap_or_else(|| format!("session#{pid}"));
        push_target(&mut targets, &mut seen, pid, true, label, self_pid);
    }

    for proc in app_tree_roots(&catalog) {
        push_target(
            &mut targets,
            &mut seen,
            proc.pid,
            true,
            format!("{}#{}", proc.name, proc.pid),
            self_pid,
        );
    }

    targets
}

#[derive(Clone)]
struct ProcInfo {
    pid: u32,
    parent: Option<u32>,
    children: u32,
    name: String,
}

fn app_tree_roots(catalog: &[ProcInfo]) -> Vec<ProcInfo> {
    let mut best: HashMap<String, ProcInfo> = HashMap::new();
    for proc in catalog {
        if !MEDIA_APPS
            .iter()
            .any(|app| process_stem(&proc.name) == process_stem(app))
        {
            continue;
        }
        let stem = process_stem(&proc.name);
        let parent_is_same = proc.parent.is_some_and(|parent| {
            catalog.iter().any(|other| {
                other.pid == parent && process_stem(&other.name) == stem
            })
        });
        let rank = (!parent_is_same, proc.children);
        match best.get(&stem) {
            None => {
                best.insert(stem, proc.clone());
            }
            Some(current) => {
                let current_parent_same = current.parent.is_some_and(|parent| {
                    catalog.iter().any(|other| {
                        other.pid == parent && process_stem(&other.name) == stem
                    })
                });
                let current_rank = (!current_parent_same, current.children);
                if rank > current_rank {
                    best.insert(stem, proc.clone());
                }
            }
        }
    }
    best.into_values().collect()
}

fn push_target(
    targets: &mut Vec<(u32, bool, String)>,
    seen: &mut HashSet<(u32, bool)>,
    pid: u32,
    include_tree: bool,
    label: String,
    self_pid: u32,
) {
    if pid == 0 || pid == self_pid {
        return;
    }
    if seen.insert((pid, include_tree)) {
        targets.push((pid, include_tree, label));
    }
}

fn process_catalog() -> Vec<ProcInfo> {
    let refreshes = RefreshKind::nothing().with_processes(ProcessRefreshKind::everything());
    let system = System::new_with_specifics(refreshes);
    let mut children: HashMap<u32, u32> = HashMap::new();
    for process in system.processes().values() {
        if let Some(parent) = process.parent() {
            *children.entry(parent.as_u32()).or_insert(0) += 1;
        }
    }
    system
        .processes()
        .values()
        .map(|process| {
            let pid = process.pid().as_u32();
            ProcInfo {
                pid,
                parent: process.parent().map(|parent| parent.as_u32()),
                children: children.get(&pid).copied().unwrap_or(0),
                name: process_exe(process),
            }
        })
        .collect()
}

fn process_stem(name: &str) -> String {
    name.to_lowercase()
        .trim_end_matches(".exe")
        .to_string()
}

fn probe(stream: &CaptureStream) -> f32 {
    let channels = stream.format.get_nchannels().max(1) as usize;
    let mut queue = VecDeque::new();
    let deadline = Instant::now() + Duration::from_millis(PROBE_MS);
    let mut peak = 0.0f32;
    while Instant::now() < deadline {
        if let Some(event) = &stream.event {
            let _ = event.wait_for_event(200);
        } else {
            thread::sleep(Duration::from_millis(12));
        }
        let _ = drain_packets(stream, &mut queue);
        peak = peak.max(peak_abs(&queue, channels));
        if peak >= HEAR_PEAK {
            break;
        }
    }
    peak
}

fn peak_abs(queue: &VecDeque<u8>, channels: usize) -> f32 {
    let stride = 4 * channels.max(1);
    let bytes: Vec<u8> = queue.iter().copied().collect();
    let mut peak = 0.0f32;
    for frame in bytes.chunks_exact(stride) {
        for channel in 0..channels {
            let index = channel * 4;
            if index + 3 >= frame.len() {
                break;
            }
            let sample = f32::from_le_bytes([
                frame[index],
                frame[index + 1],
                frame[index + 2],
                frame[index + 3],
            ]);
            peak = peak.max(sample.abs());
        }
    }
    peak
}

fn active_session_pids() -> Vec<u32> {
    let Ok(enumerator) = DeviceEnumerator::new() else {
        return Vec::new();
    };
    let mut pids = Vec::new();
    for device in render_devices(&enumerator) {
        let Ok(manager) = device.get_iaudiosessionmanager() else {
            continue;
        };
        let Ok(sessions) = manager.get_audiosessionenumerator() else {
            continue;
        };
        let Ok(count) = sessions.get_count() else {
            continue;
        };
        for index in 0..count {
            let Ok(session) = sessions.get_session(index) else {
                continue;
            };
            if session.get_state().ok() != Some(SessionState::Active) {
                continue;
            }
            if let Ok(pid) = session.get_process_id() {
                pids.push(pid);
            }
        }
    }
    pids
}

fn process_exe(process: &Process) -> String {
    process.name().to_string_lossy().to_lowercase()
}

fn render_devices(enumerator: &DeviceEnumerator) -> Vec<Device> {
    let mut devices = Vec::new();
    let mut seen = HashSet::new();

    for role in [Role::Multimedia, Role::Console, Role::Communications] {
        if let Ok(device) = enumerator.get_default_device_for_role(&Direction::Render, &role) {
            push_unique(&mut devices, &mut seen, device);
        }
    }

    if let Ok(collection) = enumerator.get_device_collection(&Direction::Render) {
        let count = collection.get_nbr_devices().unwrap_or(0);
        for index in 0..count {
            if let Ok(device) = collection.get_device_at_index(index) {
                push_unique(&mut devices, &mut seen, device);
            }
        }
    }
    devices
}

fn push_unique(devices: &mut Vec<Device>, seen: &mut HashSet<String>, device: Device) {
    let id = device
        .get_id()
        .unwrap_or_else(|_| format!("idx-{}", devices.len()));
    if seen.insert(id) {
        devices.push(device);
    }
}

fn take_mono(queue: &mut VecDeque<u8>, frames: usize, channels: usize, blockalign: usize) -> Vec<f32> {
    let bytes = frames * blockalign;
    let mut raw = vec![0u8; bytes];
    for slot in raw.iter_mut() {
        *slot = queue.pop_front().unwrap_or(0);
    }
    let mut mono = Vec::with_capacity(frames);
    let stride = 4 * channels;
    if stride == 0 {
        return mono;
    }
    for frame in raw.chunks_exact(stride) {
        let mut sum = 0.0f32;
        for channel in 0..channels {
            let index = channel * 4;
            sum += f32::from_le_bytes([
                frame[index],
                frame[index + 1],
                frame[index + 2],
                frame[index + 3],
            ]);
        }
        mono.push(sum / channels as f32);
    }
    mono
}
