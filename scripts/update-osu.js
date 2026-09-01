const fs = require("fs");

const clientId = process.env.OSU_CLIENT_ID;
const clientSecret = process.env.OSU_CLIENT_SECRET;
const username = process.env.OSU_USERNAME || "YourUsername";


async function getAccessToken() {

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
        throw new Error(
            `获取 OAuth Token 失败: ${response.status}`
        );
    }


    const data = await response.json();

    return data.access_token;
}


async function getUser(token) {

    const response = await fetch(
        `https://osu.ppy.sh/api/v2/users/@${encodeURIComponent(username)}/osu`,
        {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/json"
            }
        }
    );


    if (!response.ok) {
        throw new Error(
            `获取 osu 用户数据失败: ${response.status}`
        );
    }


    return await response.json();
}


async function main() {

    if (!clientId || !clientSecret) {
        throw new Error(
            "没有找到 OSU_CLIENT_ID 或 OSU_CLIENT_SECRET"
        );
    }


    console.log("正在获取 osu! OAuth Token...");

    const token = await getAccessToken();


    console.log(
        `正在获取 ${username} 的 osu! 数据...`
    );

    const user = await getUser(token);


    const statistics = user.statistics;


    const result = {

        username: user.username,

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

        play_time:
            statistics.play_time,

        updated_at:
            new Date().toISOString()

    };


    fs.mkdirSync("data", {
        recursive: true
    });


    fs.writeFileSync(
        "data/osu.json",
        JSON.stringify(result, null, 4)
    );


    console.log(
        "osu 数据更新成功:"
    );

    console.log(result);
}


main().catch(error => {

    console.error(error);

    process.exit(1);

});