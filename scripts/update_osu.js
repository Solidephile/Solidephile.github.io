const fs = require("fs");

const clientId = process.env.OSU_CLIENT_ID;
const clientSecret = process.env.OSU_CLIENT_SECRET;
const username = process.env.OSU_USERNAME;


async function getAccessToken() {

    console.log("正在获取 osu! Access Token...");

    const response = await fetch(
        "https://osu.ppy.sh/oauth/token",
        {
            method: "POST",

            headers: {
                "Accept": "application/json",
                "Content-Type":
                    "application/x-www-form-urlencoded"
            },

            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                grant_type: "client_credentials",
                scope: "public"
            })
        }
    );


    if (!response.ok) {

        const text = await response.text();

        throw new Error(
            `获取 Access Token 失败: ${response.status}\n${text}`
        );
    }


    const data = await response.json();

    return data.access_token;
}


async function getUser(token) {

    console.log(
        `正在获取 ${username} 的 osu! 数据...`
    );


    const url =
        `https://osu.ppy.sh/api/v2/users/@${encodeURIComponent(username)}/osu`;


    const response = await fetch(
        url,
        {
            headers: {
                "Authorization":
                    `Bearer ${token}`,

                "Accept":
                    "application/json"
            }
        }
    );


    if (!response.ok) {

        const text = await response.text();

        throw new Error(
            `获取用户数据失败: ${response.status}\n${text}`
        );
    }


    return await response.json();
}


async function main() {

    if (!clientId) {
        throw new Error(
            "OSU_CLIENT_ID 没有设置"
        );
    }


    if (!clientSecret) {
        throw new Error(
            "OSU_CLIENT_SECRET 没有设置"
        );
    }


    if (!username) {
        throw new Error(
            "OSU_USERNAME 没有设置"
        );
    }


    const token =
        await getAccessToken();


    const user =
        await getUser(token);


    const statistics =
        user.statistics;


    const updatedAt =
        new Date().toISOString();


    // 当前数据
    const result = {

        username:
            user.username,

        country:
            user.country?.name || "Unknown",

        country_code:
            user.country_code || null,

        global_rank:
            statistics.global_rank,

        country_rank:
            statistics.country_rank,

        pp:
            statistics.pp,

        play_count:
            statistics.play_count,

        play_time:
            statistics.play_time,

        total_score:
            statistics.total_score,

        total_hits:
            statistics.total_hits,

        accuracy:
            statistics.hit_accuracy,

        maximum_combo:
            statistics.maximum_combo,

        updated_at:
            updatedAt

    };


    fs.mkdirSync(
        "data",
        {
            recursive: true
        }
    );


    // --------------------------------
    // 1. 保存当前数据
    // --------------------------------

    fs.writeFileSync(

        "data/osu.json",

        JSON.stringify(
            result,
            null,
            4
        ) + "\n"

    );


    // --------------------------------
    // 2. 更新历史数据
    // --------------------------------

    const historyFile =
        "data/osu_history.json";


    let historyData = {

        username:
            username,

        mode:
            "osu",

        history:
            []

    };


    if (fs.existsSync(historyFile)) {

        try {

            historyData =
                JSON.parse(
                    fs.readFileSync(
                        historyFile,
                        "utf8"
                    )
                );

        } catch (error) {

            console.warn(
                "osu_history.json 无法解析，将重新创建。"
            );

        }

    }


    if (!Array.isArray(historyData.history)) {

        historyData.history = [];

    }


    // 只把需要用于历史图表的数据保存下来
    historyData.history.push({

        timestamp:
            updatedAt,

        global_rank:
            statistics.global_rank,

        country_rank:
            statistics.country_rank,

        pp:
            statistics.pp,

        play_count:
            statistics.play_count,

        play_time:
            statistics.play_time,

        total_score:
            statistics.total_score,

        total_hits:
            statistics.total_hits,

        accuracy:
            statistics.hit_accuracy,

        maximum_combo:
            statistics.maximum_combo

    });


    historyData.username =
        user.username;

    historyData.mode =
        "osu";


    fs.writeFileSync(

        historyFile,

        JSON.stringify(
            historyData,
            null,
            4
        ) + "\n"

    );


    console.log(
        "================================"
    );

    console.log(
        "osu! 数据更新成功！"
    );

    console.log(result);

    console.log(
        `历史数据点数量: ${historyData.history.length}`
    );

    console.log(
        "================================"
    );
}


main().catch(error => {

    console.error(error);

    process.exit(1);

});