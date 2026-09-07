async function loadOsuData() {
    try {
        const response = await fetch("data/osu.json?t=" + Date.now())

        if (!response.ok) {
            throw new Error("无法读取 osu.json");
        }

        const data = await response.json();
		
		if (data.avatar_url) {
			avatar.src = data.avatar_url;
		}

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

		const updatedAt = data.updated_at;

		function updateTimeAgo() {
			document.getElementById("last-updated").textContent =
				formatTimeAgo(updatedAt);
		}

		updateTimeAgo();

		setInterval(updateTimeAgo, 60 * 1000);

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


function formatTimeAgo(dateString) {
    const updated = new Date(dateString);
    const now = new Date();

    let seconds = Math.floor(
        (now - updated) / 1000
    );

    if (seconds < 0) {
        seconds = 0;
    }

    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }

    return `${minutes}m`;
}


loadOsuData();