import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {

  // LOAN DETAILS
  const [loanAmount, setLoanAmount] =
    useState(100000);

  const [interestRate, setInterestRate] =
    useState(11);

  const [tenure, setTenure] =
    useState(12);

  const [startMonth, setStartMonth] =
    useState("2025-01-01");

  // EMI SCHEDULE
  const [schedule, setSchedule] =
    useState([]);

  const [originalEMI, setOriginalEMI] =
    useState(0);

  // FILTERS
  const [fromMonth, setFromMonth] =
    useState("");

  const [toMonth, setToMonth] =
    useState("");

  const [rangeEMI, setRangeEMI] =
    useState("");

  const [selectedMonths, setSelectedMonths] =
    useState([""]);

  // EMI CALCULATION
  const calculateEMI = (
    P,
    annualRate,
    N
  ) => {

    const R =
      annualRate / 12 / 100;

    const emi =
      (
        P *
        R *
        Math.pow(
          1 + R,
          N
        )
      ) /
      (
        Math.pow(
          1 + R,
          N
        ) - 1
      );

    return Math.round(emi);
  };

  // GENERATE EMI SCHEDULE
  const generateSchedule = () => {

    let balance =
      Number(loanAmount);

    const emi =
      calculateEMI(
        balance,
        interestRate,
        tenure
      );

    setOriginalEMI(emi);

    const data = [];

    const start =
      new Date(startMonth);

    for (
      let i = 0;
      i < tenure;
      i++
    ) {

      const interest =
        Math.round(
          (
            balance *
            interestRate
          ) /
            12 /
            100
        );

      const principal =
        emi - interest;

      const newBalance =
        Math.max(
          0,
          balance - principal
        );

      const monthDate =
        new Date(start);

      monthDate.setMonth(
        start.getMonth() + i
      );

      data.push({

        id: i + 1,

        month:
          monthDate.toLocaleString(
            "default",
            {
              month: "short",
              year: "2-digit",
            }
          ),

        openingBalance:
          Math.round(balance),

        emi,

        principal,

        interest,

        interestDue: 0,

        balance:
          Math.round(newBalance),

        totalOS:
          Math.round(newBalance),

        status: "Paid",
      });

      balance = newBalance;
    }

    setSchedule(data);
  };

  // RECALCULATE SCHEDULE
  const recalculateSchedule = (
    updated
  ) => {

    let previousBalance =
      Number(loanAmount);

    let previousDue = 0;

    for (
      let i = 0;
      i < updated.length;
      i++
    ) {

      const row =
        updated[i];

      row.openingBalance =
        previousBalance;

      const interest =
        Math.round(
          (
            previousBalance *
            interestRate
          ) /
            12 /
            100
        );

      row.interest =
        interest;

      if (
        row.status === "Paid"
      ) {

        row.interestDue =
          previousDue;

        const effectiveEMI =
          row.emi -
          previousDue;

        row.principal =
          effectiveEMI >
          interest
            ? effectiveEMI -
              interest
            : 0;

        row.balance =
          Math.max(
            0,
            previousBalance -
              row.principal
          );

        previousDue = 0;
      }

      else {

        row.principal = 0;

        row.balance =
          previousBalance;

        row.interestDue =
          previousDue +
          interest;

        previousDue =
          row.interestDue;
      }

      row.totalOS =
        row.balance +
        row.interestDue;

      previousBalance =
        row.balance;
    }

    setSchedule(updated);
  };

  // UPDATE EMI
  const updateEMI = (
    index,
    value
  ) => {

    const updated = [
      ...schedule,
    ];

    updated[index].emi =
      Number(value);

    recalculateSchedule(
      updated
    );
  };

  // APPLY EMI TO RANGE
  const applyRangeEMI = () => {

    if (
      !fromMonth ||
      !toMonth ||
      !rangeEMI
    ) {

      alert(
        "Select range and EMI"
      );

      return;
    }

    const updated = [
      ...schedule,
    ];

    const fromIndex =
      updated.findIndex(
        (r) =>
          r.month ===
          fromMonth
      );

    const toIndex =
      updated.findIndex(
        (r) =>
          r.month ===
          toMonth
      );

    for (
      let i = fromIndex;
      i <= toIndex;
      i++
    ) {

      updated[i].emi =
        Number(rangeEMI);
    }

    recalculateSchedule(
      updated
    );
  };

  return (

    <div className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">
        Loan Account Statement
      </h1>

      <button
        onClick={generateSchedule}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl"
      >
        Generate EMI Schedule
      </button>

    </div>
  );
}

export default App;