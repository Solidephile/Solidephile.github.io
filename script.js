async function loadOsuData() {
    try {
        const response = await fetch("data/osu.json");

        if (!response.ok) {
            throw new Error("无法读取 osu.json");
        }

        const data = await response.json();

        document.getElementById("username").textContent =
            data.username;

        document.getElementById("country").textContent =
            data.country;

        document.getElementById("global-rank").textContent =
            "#" + data.global_rank.toLocaleString();

        document.getElementById("country-rank").textContent =
            "#" + data.country_rank.toLocaleString();

        document.getElementById("pp").innerHTML =
            data.pp.toLocaleString() + " <small>pp</small>";

        document.getElementById("play-time").textContent =
            formatPlayTime(data.play_time);

        document.getElementById("last-updated").textContent =
            data.updated_at;

    } catch (error) {
        console.error("加载 osu 数据失败：", error);
    }
}


function formatPlayTime(seconds) {
    const hours = Math.floor(seconds / 3600);

    const minutes =
        Math.floor((seconds % 3600) / 60);

    return `${hours}h ${minutes}m`;
}


loadOsuData();