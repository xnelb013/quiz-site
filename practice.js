const arr = [
  [1, 0, 1],
  [1, 1, 1],
  [1, 1, 1],
];

function minDistance(arr) {
  let result = [];
  let rows = arr.length;
  let cols = arr[0].length;
  for (let i = 0; i < rows; i++) {
    result[i] = [];
    for (let j = 0; j < cols; j++) {
      if (arr[i][j] === 0) {
        result[i][j] = 0;
      } else {
        let minDist = Number.MAX_VALUE;
        for (let k = 0; k < rows; k++) {
          for (let l = 0; l < cols; l++) {
            if (arr[k][l] === 0) {
              let dist = Math.abs(i - k) + Math.abs(j - l);
              minDist = Math.min(minDist, dist);
            }
          }
        }
        result[i][j] = minDist;
      }
    }
  }
  return result;
}

console.log(minDistance(arr));
