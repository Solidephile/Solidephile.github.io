const fs = require("fs");

const clientId = process.env.OSU_CLIENT_ID;
const clientSecret = process.env.OSU_CLIENT_SECRET;
const username = process.env.OSU_USERNAME;

// 是否更新历史数据
// 默认 true
const updateHistory =
    process.env.UPDATE_HISTORY !== "false";


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


// 获取 UTC+8 的日期
// 返回格式：YYYY-MM-DD
function getUTC8Date(date) {

    return new Intl.DateTimeFormat(
        "en-CA",
        {
            timeZone: "Asia/Shanghai",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }
    ).format(date);
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


    // --------------------------------
    // 当前数据
    // --------------------------------

    const result = {

        username:
            user.username,
		
		avatar_url: 
			user.avatar_url,

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


    // Debug 模式：
    // 只更新 osu.json，不修改历史
    if (!updateHistory) {

        console.log(
            "当前为 Debug 模式，不更新 osu_history.json。"
        );

        console.log(
            "================================"
        );

        console.log(
            "osu! 数据更新成功！"
        );

        console.log(result);

        console.log(
            "================================"
        );

        return;
    }


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


    // --------------------------------
    // 3. 判断今天 UTC+8 是否已经记录
    // --------------------------------

    const todayUTC8 =
        getUTC8Date(new Date());


    let alreadyUpdatedToday = false;


    // 从最后一条开始检查
    // 因为历史数据正常情况下是按照时间顺序保存的
    for (
        let i = historyData.history.length - 1;
        i >= 0;
        i--
    ) {

        const item =
            historyData.history[i];


        if (!item.timestamp) {
            continue;
        }


        const itemDate =
            getUTC8Date(
                new Date(item.timestamp)
            );


        if (itemDate === todayUTC8) {

            alreadyUpdatedToday = true;

        }

        break;
    }


    // --------------------------------
    // 4. 追加历史数据
    // --------------------------------

    if (alreadyUpdatedToday) {

        console.log(
            `UTC+8 今天（${todayUTC8}）已经记录过历史数据，跳过。`
        );

    } else {

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


        console.log(
            `已添加 ${todayUTC8} 的历史数据。`
        );
    }


    historyData.username =
        user.username;


    historyData.mode =
        "osu";


    // --------------------------------
    // 5. 保存历史数据
    // --------------------------------

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
