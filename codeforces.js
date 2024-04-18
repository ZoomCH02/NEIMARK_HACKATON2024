var { CodeforcesAPI } = require("codeforces-api-ts");
CodeforcesAPI.setCredentials({
  API_KEY: "2c9415813f304f70911dbba63b667d850df7d0f7",
  API_SECRET: "b78c0c208ca7d925b4e4b412818b2e4ad334828b",
});
var f = [{name: "", rank :0, total: 0}]
/**
 * 
 * @param {string} handle Логин пользоваеля 
 * @returns {f} Массив с данными пользователя и конкурсов, в которых он участвовал
 */
module.exports.getUserStats = async (handle) => {
  var user = await CodeforcesAPI.call("user.rating", { handle: handle });
  var data = [];
  for (var contest in user.result) {
    console.log(contest);
    var contestInfo = await CodeforcesAPI.call("contest.standings", {
      contestId: parseInt(user.result[contest].contestId),
    });
    console.log(contestInfo);
    data.push({
      name: contestInfo.result.contest.name,
      rank: user.result[contest].rank,
      total: contestInfo.result.rows.length,
    });
  }
  return data;
};
