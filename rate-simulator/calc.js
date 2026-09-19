/*
 * 비례율_시뮬레이터.html이 쓰는 순수 계산 함수 모음 (약식/고급 모드 공유).
 * 브라우저에서는 window.RateCalc로, Node 테스트에서는 module.exports로 노출.
 */
(function(){
  function calcProportion({ C, A, B }){
    if (!C) return null;
    return (A - B) / C;
  }

  function calcScenario({ C, A0, B0, A1, B1, memberCount, myAppraisal }){
    const rate0 = calcProportion({ C, A: A0, B: B0 });
    const rate1 = calcProportion({ C, A: A1, B: B1 });
    const X = B1 - B0;
    const Y = A1 - A0;
    const Z = X - Y;
    const perMember = (memberCount != null && memberCount > 0) ? Z / memberCount : null;
    const deltaRate = (rate0 != null && rate1 != null) ? rate1 - rate0 : null;
    const myZ = (myAppraisal != null && rate0 != null && rate1 != null)
      ? myAppraisal * (rate0 - rate1)
      : null;
    return { rate0, rate1, deltaRate, X, Y, Z, perMember, myZ };
  }

  function sumUnitRows(rows){
    let totalCount = 0, totalAmount = 0;
    (rows || []).forEach(row => {
      const count = Number(row.count) || 0;
      const unitPrice = Number(row.unitPrice) || 0;
      totalCount += count;
      totalAmount += count * unitPrice;
    });
    return { totalCount, totalAmount };
  }

  function pctToAmount(base, pct){
    return base * (1 + pct / 100);
  }

  function amountToPct(base, amount){
    if (!base) return null;
    return (amount / base - 1) * 100;
  }

  function manwonToWon(manwon){
    return Math.round(manwon) * 10000;
  }

  function wonToManwon(won){
    return Math.round(won / 10000);
  }

  function calcTotalConstructionCost(areaSqm, pricePerPyeong){
    return (areaSqm / 3.3058) * pricePerPyeong;
  }

  function calcAreaFromCost(cost, pricePerPyeong){
    if (!pricePerPyeong) return null;
    return (cost / pricePerPyeong) * 3.3058;
  }

  function calcPricePerPyeongFromCost(cost, areaSqm){
    if (!areaSqm) return null;
    return (cost / areaSqm) * 3.3058;
  }

  function calcOtherExpenseChangeFromRate(baseOtherExpense, ratePct){
    return baseOtherExpense * (ratePct / 100);
  }

  // 약식 계산: 인당 증감액 = (총공사비 증액분 - 총수입 증가분) ÷ 조합원수.
  // 고급모드의 Z(=공사비증가-수입증가, 양수=추가분담금)와 부호 관례를 맞춘다.
  function calcSimplifiedDelta(constructionCostDelta, incomeDelta, memberCount){
    if (!memberCount) return null;
    return (constructionCostDelta - incomeDelta) / memberCount;
  }

  function calcOtherIncome(totalIncome, memberSales, generalSales){
    return totalIncome - memberSales - generalSales;
  }

  function calcOtherExpense(totalExpense, constructionCost){
    return totalExpense - constructionCost;
  }

  function calcSalesPriceChange(oldPrice, newPrice, units){
    return (newPrice - oldPrice) * units;
  }

  function calcContingencyReserve(reserveAmt, unsoldReserveAmt){
    return (reserveAmt || 0) + (unsoldReserveAmt || 0);
  }

  function calcRateFromRepresentativeUnit(oldPrice, newPrice){
    return (newPrice / oldPrice - 1) * 100;
  }

  const PYEONG_REFERENCE = [[39, 18], [49, 22], [59, 25], [74, 30], [84, 33]];

  function calcAverageMultiplier(){
    const multipliers = PYEONG_REFERENCE.map(([sqm, pyeong]) => sqm / pyeong);
    return multipliers.reduce((sum, m) => sum + m, 0) / multipliers.length;
  }

  function calcPyeong(sqm){
    const exact = PYEONG_REFERENCE.find(([refSqm]) => refSqm === sqm);
    if (exact) return exact[1];
    return sqm / calcAverageMultiplier();
  }

  function solveReserveShiftToTarget(A, B, C, targetRatio){
    const targetB = A - targetRatio * C;
    return targetB - B;
  }

  function solveMemberPriceIncreaseToTarget(A, B, C, targetRatio){
    return targetRatio * C - (A - B);
  }

  function calcUnitComparisonTable(unitRows, myAppraisal, proportionRate){
    const rightsValue = myAppraisal * proportionRate;
    return (unitRows || []).map(row => ({
      label: row.label,
      memberPrice: row.unitPrice,
      rightsValue,
      dues: row.unitPrice - rightsValue,
    }));
  }

  const api = {
    calcProportion, calcScenario, sumUnitRows, pctToAmount, amountToPct,
    manwonToWon, wonToManwon, calcTotalConstructionCost, calcOtherIncome, calcOtherExpense,
    calcSalesPriceChange, calcContingencyReserve, calcRateFromRepresentativeUnit,
    calcAverageMultiplier, calcPyeong, solveReserveShiftToTarget, solveMemberPriceIncreaseToTarget,
    calcUnitComparisonTable, calcAreaFromCost, calcPricePerPyeongFromCost,
    calcOtherExpenseChangeFromRate, calcSimplifiedDelta,
  };
  if (typeof module !== 'undefined' && module.exports){
    module.exports = api;
    if (typeof window !== 'undefined') window.RateCalc = api;
  } else {
    window.RateCalc = api;
  }
})();
