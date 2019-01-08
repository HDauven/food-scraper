const prep = 'Prep time: 20 Minutes';
const cook = "cook time: 2 hours 14 minutes";
const readyIn = 'Ready in 2 Hours 34 Minutes';

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

module.exports = {
  getMinutes
};

console.log(getMinutes(prep));
console.log(getMinutes(cook));
console.log(getMinutes(readyIn));