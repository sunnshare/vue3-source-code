// https://en.wikipedia.org/wiki/Longest_increasing_subsequence
export function getSequence(arr: number[]): number[] {
  const preArr = arr.slice(0) // 前驱节点的索引数组，用于回溯正确的顺序
  const result = [0]
  let lastIndex, // 结果数组最后一项存的索引值
    start,
    end,
    middle
  const len = arr.length
  // 如果比当前末尾大则追加，比末尾小则二分查找进行替换
  // 算出来的结果数组长度是对的，顺序不对
  for (let i = 0; i < len; i++) {
    const arrI = arr[i] // 每一项的值
    if (arrI !== 0) {
      lastIndex = result[result.length - 1]
      if (arr[lastIndex] < arrI) {
        preArr[i] = lastIndex // 记录结果数组
        // 如果比最后一项大，加入结果数组并 continue
        result.push(i)
        continue
      }
      // 二分查找 替换元素
      start = 0
      end = result.length - 1
      while (start < end) {
        middle = (start + end) >> 1 // 中间的索引
        if (arr[result[middle]] < arrI) {
          start = middle + 1 // 找右半部分
        } else {
          end = middle // 找左半部分
        }
      }
      if (arrI < arr[result[start]]) {
        if (start > 0) {
          preArr[i] = result[start - 1] // 找到索引进行记录
        }
        result[start] = i // 找到更有潜力的数组进行替换（贪心算法）
      }
    }
  }

  // 通过前驱节点找到正确的调用顺序
  let resultLen = result.length
  let current = result[resultLen - 1] // 取出最后一个
  // 通过最后一项 向前查找
  while (resultLen-- > 0) {
    result[resultLen] = current // 最后一项肯定是正确的
    current = preArr[current] // 当前记录的索引就是上一个项
  }
  return result
}
