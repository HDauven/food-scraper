const getMinutes = (inputString) => {
  if (!inputString) {
    return null;
  }
  let totalMinutes = 0;
  let result = null;
  inputString = inputString.trim().toLowerCase();

  if (inputString.indexOf('hours') >= 0) {
    result = inputString.match(/([0-9]*) (hour)/i);
    totalMinutes += parseInt(result[1]) * 60;
  }

  if (inputString.indexOf('minutes') >= 0) {
    result = inputString.match(/([0-9]*) (minute)/i);
    totalMinutes += parseInt(result[1]);
  }

  if (totalMinutes <= 0) {
    return null;
  }

  return totalMinutes;
}

const sleepTimer = ms => new Promise(res => setTimeout(res, ms));

module.exports = {
  getMinutes,
  sleepTimer
};