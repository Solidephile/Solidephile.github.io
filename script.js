const DATA_URL = `data/osu.json?t=${Date.now()}`;
const HISTORY_URL = `data/osu_history.json?t=${Date.now()}`;

let charts = [];

const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,

    animation: {
        duration: 500
    },

    interaction: {
        mode: "index",
        intersect: false
    },

    plugins: {
        legend: {
            display: false
        },

        tooltip: {
            displayColors: false,

            backgroundColor: "rgba(20, 17, 24, 0.96)",

            borderColor: "rgba(255,255,255,0.08)",
            borderWidth: 1,

            titleColor: "#f7f3f7",
            bodyColor: "#c8c1ca",

            padding: 10,
            cornerRadius: 10
        }
    },

    scales: {
        x: {
            border: {
                display: false
            },

            grid: {
                display: false
            },

            ticks: {
                color: "#706873",

                maxTicksLimit: 7,

                font: {
                    size: 10
                }
            }
        },

        y: {
            border: {
                display: false
            },

            grid: {
                color: "rgba(255,255,255,0.045)"
            },

            ticks: {
                color: "#706873",

                maxTicksLimit: 5,

                padding: 6,

                font: {
                    size: 10
                }
            }
        }
    }
};


/* =========================
   Number Formatting
   ========================= */

function formatNumber(value, decimals = 0) {
    return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}


function formatPlayTime(seconds) {
    const totalMinutes = Math.floor(Number(seconds) / 60);

    const days = Math.floor(totalMinutes / 1440);

    const hours = Math.floor(
        (totalMinutes % 1440) / 60
    );

    const minutes = totalMinutes % 60;

    return `${days}d ${hours}h ${minutes}m`;
}


function formatRelativeTime(timestamp) {
    const diff = Math.max(
        0,
        Date.now() - new Date(timestamp).getTime()
    );

    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
        return "just now";
    }

    if (minutes < 60) {
        return `${minutes}m`;
    }

    if (minutes < 1440) {
        return `${Math.floor(minutes / 60)}h`;
    }

    return `${Math.floor(minutes / 1440)}d`;
}


function formatDate(timestamp) {
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric"
    }).format(new Date(timestamp));
}


/* =========================
   Chart Helpers
   ========================= */

function getChartRange(
    values,
    paddingRatio = 0.08,
    minimumPadding = 1
) {
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) {
        return {
            min: min - minimumPadding,
            max: max + minimumPadding
        };
    }

    const padding = Math.max(
        (max - min) * paddingRatio,
        minimumPadding
    );

    return {
        min: min - padding,
        max: max + padding
    };
}


function createGradient(ctx, chartArea) {
    const gradient = ctx.createLinearGradient(
        0,
        chartArea.top,
        0,
        chartArea.bottom
    );

    gradient.addColorStop(
        0,
        "rgba(255, 102, 171, 0.26)"
    );

    gradient.addColorStop(
        1,
        "rgba(255, 102, 171, 0.015)"
    );

    return gradient;
}


/* =========================
   Create Line Chart
   ========================= */

function makeLineChart({
    id,
    data,
    key,
    label,
    valueFormat = "compact",
    suffix = "",
    reverse = false,
    fillBelow = false,
    yMin,
    yMax
}) {
    const canvas = document.getElementById(id);

    if (!canvas) {
        return;
    }


    const values = data.map(
        item => Number(item[key])
    );


    const range =
        yMin === undefined || yMax === undefined
            ? getChartRange(
                values,
                0.08,
                key === "accuracy"
                    ? 0.01
                    : 1
            )
            : {
                min: yMin,
                max: yMax
            };


    const ctx = canvas.getContext("2d");


    function formatValue(value) {

        if (valueFormat === "integer") {
            return formatNumber(value);
        }


        if (valueFormat === "raw") {
            return Number(value).toLocaleString(
                "en-US"
            );
        }


        if (valueFormat === "decimal") {
            return formatNumber(value, 2);
        }


        return Number(value).toLocaleString(
            "en-US",
            {
                notation: "compact",
                maximumFractionDigits: 2
            }
        );
    }


    const chart = new Chart(ctx, {

        type: "line",

        data: {

            labels: data.map(
                item => formatDate(item.timestamp)
            ),

            datasets: [

                {
                    label: label,

                    data: values,

                    borderColor: "#ff66ab",

                    borderWidth: 2,

                    pointRadius:
                        data.length <= 20
                            ? 3
                            : 0,

                    pointHoverRadius: 5,

                    pointBackgroundColor:
                        "#ff66ab",

                    pointBorderWidth: 0,

                    tension: 0.32,

                    fill: fillBelow ? "start" : "origin",

                    backgroundColor:
                        context => {

                            const chart =
                                context.chart;

                            const {
                                ctx,
                                chartArea
                            } = chart;


                            if (!chartArea) {
                                return "rgba(255, 102, 171, 0.05)";
                            }


                            return createGradient(
                                ctx,
                                chartArea
                            );
                        }
                }

            ]
        },


        options: {

            ...chartDefaults,


            scales: {

                ...chartDefaults.scales,


                x: {
                    ...chartDefaults.scales.x
                },


                y: {

                    ...chartDefaults.scales.y,

                    reverse: reverse,

                    min: range.min,

                    max: range.max,


                    ticks: {

                        ...chartDefaults.scales.y.ticks,


                        callback: value => {
                            return `${formatValue(value)}${suffix}`;
                        }

                    }

                }

            },


            plugins: {

                ...chartDefaults.plugins,


                tooltip: {

                    ...chartDefaults.plugins.tooltip,


                    callbacks: {

                        label: context => {

                            return `${label}: ${formatValue(
                                context.parsed.y
                            )}${suffix}`;

                        }

                    }

                }

            }

        }

    });


    charts.push(chart);
}


/* =========================
   Update Profile
   ========================= */

function updateProfile(data) {

    /* Avatar */

    const avatar =
        document.getElementById("avatar");


    if (
        data.avatar_url
    ) {
        avatar.src = data.avatar_url;
    }


    /* Username */

    if (data.username) {

        document.getElementById(
            "username"
        ).textContent = data.username;

    }


    /* Country */

    if (data.country) {

        document.getElementById(
            "country"
        ).textContent =
            `${data.country}${
                data.country_code
                    ? ` · ${data.country_code}`
                    : ""
            }`;

    }


    /* Global Rank */

    if (data.global_rank != null) {

        document.getElementById(
            "global-rank"
        ).textContent =
            `#${formatNumber(
                data.global_rank
            )}`;

    }


    /* Country Rank */

    if (data.country_rank != null) {

        document.getElementById(
            "country-rank"
        ).textContent =
            `#${formatNumber(
                data.country_rank
            )}`;

    }


    /* PP */

    if (data.pp != null) {

        document.getElementById(
            "pp"
        ).innerHTML =
            `${formatNumber(
                data.pp,
                2
            )} <small>pp</small>`;

    }


    /* Play Time */

    if (data.play_time != null) {

        document.getElementById(
            "play-time"
        ).textContent =
            formatPlayTime(
                data.play_time
            );

    }


    /* Last Updated */

    if (data.updated_at) {

        document.getElementById(
            "last-updated"
        ).textContent =
            formatRelativeTime(
                data.updated_at
            );

    }
}


/* =========================
   Render History Charts
   ========================= */

function renderCharts(history) {

    if (
        !Array.isArray(history) ||
        history.length === 0
    ) {

        document.querySelector(
            ".charts-grid"
        ).innerHTML = `
            <div class="chart-card chart-card-wide">
                <div class="chart-error">
                    No history data available.
                </div>
            </div>
        `;

        return;
    }


    /*
     * Make sure the history is ordered
     * from oldest to newest.
     */

    history.sort(
        (a, b) =>
            new Date(a.timestamp) -
            new Date(b.timestamp)
    );


    /* Number of data points */

    document.getElementById(
        "history-count"
    ).textContent =
        `${history.length} data point${
            history.length === 1
                ? ""
                : "s"
        }`;


    /* =========================
       PP
       ========================= */

    makeLineChart({

        id: "pp-chart",

        data: history,

        key: "pp",

        label: "PP",

        valueFormat: "decimal",

        suffix: " pp"

    });


    /* =========================
       Global Rank
       ========================= */

    makeLineChart({

        id: "global-rank-chart",

        data: history,

        key: "global_rank",

        label: "Global rank",

        valueFormat: "integer",

        /*
         * Smaller rank = better
         *
         * Reverse the axis so that
         * improving rank moves upward.
         */

        reverse: true,
		
		fillBelow: true

    });


    /* =========================
       Country Rank
       ========================= */

    makeLineChart({

        id: "country-rank-chart",

        data: history,

        key: "country_rank",

        label: "Country rank",

        valueFormat: "integer",

        /*
         * Smaller rank = better.
         */

        reverse: true,
		
		fillBelow: true

    });


    /* =========================
       Play Count
       ========================= */

    makeLineChart({

        id: "play-count-chart",

        data: history,

        key: "play_count",

        label: "Play count",

        valueFormat: "integer"

    });


    /* =========================
       Play Time
       ========================= */

    /*
     * osu! API stores play_time
     * in seconds.
     *
     * Convert it to hours for
     * the chart.
     */

    const playTimeHours =
        history.map(item => ({

            ...item,

            play_time_hours:
                Number(item.play_time) /
                3600

        }));


    makeLineChart({

        id: "play-time-chart",

        data: playTimeHours,

        key: "play_time_hours",

        label: "Play time",

        valueFormat: "decimal",

        suffix: " h"

    });


    /* =========================
       Total Score
       ========================= */

    makeLineChart({

        id: "total-score-chart",

        data: history,

        key: "total_score",

        label: "Total score",

        valueFormat: "compact"

    });


    /* =========================
       Total Hits
       ========================= */

    makeLineChart({

        id: "total-hits-chart",

        data: history,

        key: "total_hits",

        label: "Total hits",

        valueFormat: "compact"

    });


    /* =========================
       Accuracy
       ========================= */

    const accuracyValues =
        history.map(
            item => Number(item.accuracy)
        );


    const accuracyMin =
        Math.min(...accuracyValues);


    const accuracyMax =
        Math.max(...accuracyValues);


    makeLineChart({

        id: "accuracy-chart",

        data: history,

        key: "accuracy",

        label: "Accuracy",

        valueFormat: "decimal",

        suffix: "%",

        /*
         * Accuracy changes are usually
         * very small, so use a tighter
         * Y-axis range to make the
         * trend visible.
         */

        yMin: Math.max(
            0,
            accuracyMin - 0.01
        ),

        yMax: Math.min(
            100,
            accuracyMax + 0.01
        )

    });
}


/* =========================
   Load Page
   ========================= */

async function loadPage() {

    try {

        const [
            statsResponse,
            historyResponse
        ] = await Promise.all([

            fetch(DATA_URL),

            fetch(HISTORY_URL)

        ]);


        /* Check osu.json */

        if (!statsResponse.ok) {

            throw new Error(
                `osu.json request failed: ${statsResponse.status}`
            );

        }


        /* Check osu_history.json */

        if (!historyResponse.ok) {

            throw new Error(
                `osu_history.json request failed: ${historyResponse.status}`
            );

        }


        /* Parse JSON */

        const stats =
            await statsResponse.json();


        const historyData =
            await historyResponse.json();


        /* Update current profile */

        updateProfile(stats);


        /* Render history */

        renderCharts(
            historyData.history
        );

    }

    catch (error) {

        console.error(
            "Failed to load osu! data:",
            error
        );


        document.getElementById(
            "history-count"
        ).textContent =
            "Unable to load";


        document
            .querySelectorAll(".chart-wrap")
            .forEach(chart => {

                chart.innerHTML = `
                    <div class="chart-error">
                        Unable to load history data.
                    </div>
                `;

            });

    }

}


/* =========================
   Start
   ========================= */

loadPage();