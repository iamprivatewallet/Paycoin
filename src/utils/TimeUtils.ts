export function formatTime(
    timestamp?: number|undefined,
    format="YYYY-MM-DD HH:mm:ss"
): string {
    if (!timestamp) return "--"
    const date = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return format
        .replace("YYYY", year.toString())
        .replace("MM", month)
        .replace("DD", day)
        .replace("HH", hours)
        .replace("mm", minutes)
        .replace("ss", seconds);
}

export function remainingSecondsWithFormat(timestamp: number|undefined){
    if (!timestamp) return "--"
    const seconds = remainingSeconds(timestamp);
    const format = formatDuration(seconds);
    return format
}

export function remainingSeconds(timestamp: number){
    const now = Date.now();
    const diff = timestamp - now;
    return Math.max(Math.floor(diff / 1000), 0);
}

export function formatDuration(totalSeconds: number){
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}