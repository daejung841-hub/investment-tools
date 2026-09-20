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

  // 목표값찾기 "B안": 조합원분양가 인상 필요액(increaseWon)을 기존 조합원분양수입(totalMemberIncomeWon)
  // 대비 비율로 환산해, 모든 평형에 동일 비율로 적용했을 때의 평형별 변경 전/후 분양가·분담금을 계산한다.
  function calcMemberPriceIncreaseTable(unitRows, myAppraisal, currentRate, increaseWon, totalMemberIncomeWon){
    const ratio = totalMemberIncomeWon ? increaseWon / totalMemberIncomeWon : 0;
    const rightsCurrent = myAppraisal * currentRate;
    const rights100 = myAppraisal * 1.0;
    return (unitRows || []).map(row => {
      const newPrice = row.unitPrice * (1 + ratio);
      return {
        label: row.label,
        oldPrice: row.unitPrice,
        newPrice,
        oldDues: row.unitPrice - rightsCurrent,
        newDues: newPrice - rights100,
      };
    });
  }

  // 목표값찾기 "직접 입력 시뮬레이션": 사용자가 임의로 넣은 인상률(ratePct, %)을 모든 평형에
  // 동일 적용한다. calcMemberPriceIncreaseTable과 달리 목표 비례율이 100% 고정이 아니므로
  // (직접 입력한 인상률이 낳는 결과 비례율은 그때그때 다르다) 호출 쪽이 계산한 newRate를 그대로 받는다.
  function calcCustomRateIncreaseTable(unitRows, myAppraisal, currentRate, newRate, ratePct){
    const rightsCurrent = myAppraisal * currentRate;
    const rightsNew = myAppraisal * newRate;
    const ratio = ratePct / 100;
    return (unitRows || []).map(row => {
      const newPrice = row.unitPrice * (1 + ratio);
      return {
        label: row.label,
        oldPrice: row.unitPrice,
        newPrice,
        oldDues: row.unitPrice - rightsCurrent,
        newDues: newPrice - rightsNew,
      };
    });
  }

  // 평형별 표 전체를 대표하는 "평당분양가" 한 줄 요약: 최다세대 평형의 세대수 비중이
  // threshold(기본 65%) 이상이면 그 평형을 대표값으로, 미만이면 세대수가중 평균을 반환한다.
  // unitRows: [{label, count, oldPrice, newPrice?}] — newPrice를 생략하면 oldPrice와 같은 값을 쓴다
  // (변경 전/미입력 상태에서는 화살표 없이 단일값으로 표시할 수 있도록).
  function calcRepresentativeOrAverageUnitPrice(unitRows, threshold){
    const th = threshold == null ? 0.65 : threshold;
    const rows = (unitRows || []).filter(r => r.count > 0);
    if (!rows.length) return null;
    const totalCount = rows.reduce((sum, r) => sum + r.count, 0);
    const rep = rows.reduce((max, r) => (r.count > max.count ? r : max));
    const share = totalCount ? rep.count / totalCount : 0;
    const pyeongOf = (label) => calcPyeong(parseFloat(label));

    if (share >= th){
      const oldPrice = rep.oldPrice;
      const newPrice = rep.newPrice != null ? rep.newPrice : rep.oldPrice;
      const pyeong = pyeongOf(rep.label);
      return {
        mode: 'representative', label: rep.label, share, oldPrice, newPrice,
        oldPricePerPyeong: pyeong ? oldPrice / pyeong : null,
        newPricePerPyeong: pyeong ? newPrice / pyeong : null,
      };
    }

    let totalOldAmount = 0, totalNewAmount = 0, totalPyeong = 0;
    rows.forEach(r => {
      const pyeong = pyeongOf(r.label);
      totalOldAmount += r.count * r.oldPrice;
      totalNewAmount += r.count * (r.newPrice != null ? r.newPrice : r.oldPrice);
      totalPyeong += r.count * pyeong;
    });
    return {
      mode: 'average', label: null, share,
      oldPrice: totalOldAmount / totalCount,
      newPrice: totalNewAmount / totalCount,
      oldPricePerPyeong: totalPyeong ? totalOldAmount / totalPyeong : null,
      newPricePerPyeong: totalPyeong ? totalNewAmount / totalPyeong : null,
    };
  }

  const api = {
    calcProportion, calcScenario, sumUnitRows, pctToAmount, amountToPct,
    manwonToWon, wonToManwon, calcTotalConstructionCost, calcOtherIncome, calcOtherExpense,
    calcSalesPriceChange, calcContingencyReserve, calcRateFromRepresentativeUnit,
    calcAverageMultiplier, calcPyeong, solveReserveShiftToTarget, solveMemberPriceIncreaseToTarget,
    calcUnitComparisonTable, calcMemberPriceIncreaseTable, calcAreaFromCost, calcPricePerPyeongFromCost,
    calcOtherExpenseChangeFromRate, calcSimplifiedDelta,
    calcCustomRateIncreaseTable, calcRepresentativeOrAverageUnitPrice,
  };
  if (typeof module !== 'undefined' && module.exports){
    module.exports = api;
    if (typeof window !== 'undefined') window.RateCalc = api;
  } else {
    window.RateCalc = api;
  }
})();
