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
    
  const [rangeEMI, setRangeEMI] =
  useState("");

  const [originalEMI, setOriginalEMI] =
    useState(0);

  // FILTERS
  const [fromMonth, setFromMonth] =
    useState("");

  const [toMonth, setToMonth] =
    useState("");

  const [selectedMonths, setSelectedMonths] =
    useState([""]);

  // EMI FORMULA
  const calculateEMI = (
    P,
    annualRate,
    N
  ) => {

    const R =
      annualRate / 12 / 100;

    const emi =
      (P *
        R *
        Math.pow(
          1 + R,
          N
        )) /
      (Math.pow(
        1 + R,
        N
      ) -
        1);

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

    let data = [];

    const start =
      new Date(startMonth);

    for (
      let i = 0;
      i < tenure;
      i++
    ) {

      const interest =
        Math.round(
          (balance *
            interestRate) /
            12 /
            100
        );

      const principal =
        emi - interest;

      const newBalance =
        Math.max(
          0,
          balance -
            principal
        );

      const monthDate =
        new Date(start);

      monthDate.setMonth(
        start.getMonth() +
          i
      );

      data.push({
        id: i + 1,

        month:
          monthDate.toLocaleString(
            "default",
            {
              month:
                "short",
              year:
                "2-digit",
            }
          ),

        openingBalance:
          Math.round(
            balance
          ),

        emi,

        principal,

        interest,

        carryForwardDue: 0,

        interestDue: 0,

        balance:
          Math.round(
            newBalance
          ),

        totalOS:
          Math.round(
            newBalance
          ),

        status: "Paid",
      });

      balance =
        newBalance;
    }

    setSchedule(data);
  };

  // UPDATE EMI
 // UPDATE EMI
const updateEMI = (
  index,
  value
) => {

  const updated = [
    ...schedule,
  ];

  const emiValue =
    Number(value);

  updated[index].emi =
    emiValue;

  // AUTO STATUS CHANGE
  if (emiValue === 0) {

    updated[index].status =
      "Overdue";
  }

  else {

    if (
      updated[index]
        .status ===
      "Overdue"
    ) {

      updated[index].status =
        "Paid";
    }
  }

  // RECALCULATE
  recalculateSchedule(
    updated
  );
};


// APPLY EMI TO SELECTED RANGE
const applyRangeEMI = () => {

  // VALIDATION
  if (
    !fromMonth ||
    !toMonth ||
    !rangeEMI
  ) {

    alert(
      "Select start month, end month and EMI"
    );

    return;
  }

  const updated = [
    ...schedule,
  ];

  // FIND RANGE
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

  // INVALID RANGE
  if (
    fromIndex === -1 ||
    toIndex === -1
  ) {

    alert(
      "Invalid range selected"
    );

    return;
  }

  // START > END
  if (
    fromIndex > toIndex
  ) {

    alert(
      "Start month cannot be after end month"
    );

    return;
  }

  // APPLY EMI
  for (
    let i = fromIndex;
    i <= toIndex;
    i++
  ) {

    updated[i].emi =
      Number(rangeEMI);
  }

  // RECALCULATE
  recalculateSchedule(
    updated
  );

  alert(
    "Revised EMI applied successfully"
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

  if (
    fromIndex === -1 ||
    toIndex === -1
  ) {

    alert(
      "Invalid range selected"
    );

    return;
  }

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

  // RECALCULATE
  const recalculateSchedule = (
    updated
  ) => {

    let previousDue = 0;

    let previousBalance =
      Number(loanAmount);

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
          (previousBalance *
            interestRate) /
            12 /
            100
        );

      row.interest =
        interest;

      if (
        row.status ===
        "Paid"
      ) {

        row.carryForwardDue =
          previousDue;

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

        row.carryForwardDue =
          previousDue;

        row.interestDue =
          previousDue +
          interest;

        row.principal = 0;

        row.balance =
          previousBalance;

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

  // ADD MONTH
  const addMonthBox = () => {

    setSelectedMonths([
      ...selectedMonths,
      "",
    ]);
  };

  // UPDATE MONTH
  const updateSelectedMonth = (
    index,
    value
  ) => {

    const updated = [
      ...selectedMonths,
    ];

    updated[index] = value;

    setSelectedMonths(updated);
  };

  // REMOVE MONTH
  const removeMonthBox = (
    index
  ) => {

    const updated =
      selectedMonths.filter(
        (_, i) =>
          i !== index
      );

    setSelectedMonths(updated);
  };

  // RESET FILTERS
  const resetAllFilters = () => {

    setSelectedMonths([
      "",
    ]);

    setFromMonth("");

    setToMonth("");
  };

  // PRINT
  const handlePrint = () => {

    window.print();
  };

  // EXPORT CSV
  const exportCSV = () => {

    const headers = [
      "Month",
      "Opening Balance",
      "EMI",
      "Principal",
      "Interest",
      "Interest Due",
      "Balance",
      "Total OS",
      "Status",
    ];

    const rows =
      filteredSchedule.map(
        (row) => [
          row.month,
          row.openingBalance,
          row.emi,
          row.principal,
          row.interest,
          row.interestDue,
          row.balance,
          row.totalOS,
          row.status,
        ]
      );

    let csvContent =
      headers.join(",") +
      "\n";

    rows.forEach((row) => {

      csvContent +=
        row.join(",") +
        "\n";
    });

    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.setAttribute(
      "download",
      "loan_schedule.csv"
    );

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );
  };

  // EXPORT PDF
  const exportPDF = () => {

    const doc =
      new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "Loan Account Statement",
      14,
      20
    );

    autoTable(doc, {
      startY: 30,

      head: [[
        "Sl No",
        "Month",
        "Opening",
        "EMI",
        "Principal",
        "Interest",
        "Interest Due",
        "Balance",
        "Total OS",
        "Status",
      ]],

      body:
        filteredSchedule.map(
          (
            row,
            index
          ) => [
            index + 1,
            row.month,
            row.openingBalance,
            row.emi,
            row.principal,
            row.interest,
            row.interestDue,
            row.balance,
            row.totalOS,
            row.status,
          ]
        ),
    });

    doc.save(
      "loan_schedule.pdf"
    );
  };

  // FILTER LOGIC
  const filteredSchedule =
    schedule.filter((row) => {

      let rangeMatch = true;

      if (
        fromMonth &&
        toMonth
      ) {

        const currentIndex =
          schedule.indexOf(
            row
          );

        const fromIndex =
          schedule.findIndex(
            (r) =>
              r.month ===
              fromMonth
          );

        const toIndex =
          schedule.findIndex(
            (r) =>
              r.month ===
              toMonth
          );

        rangeMatch =
          currentIndex >=
            fromIndex &&
          currentIndex <=
            toIndex;
      }

      let customMatch = true;

      if (
        selectedMonths.some(
          (month) =>
            month.trim() !==
            ""
        )
      ) {

        customMatch =
          selectedMonths.includes(
            row.month
          );
      }

      return (
        rangeMatch &&
        customMatch
      );
    });

  // TOTALS
  const totalOverdue =
    filteredSchedule.reduce(
      (sum, row) =>
        sum +
        row.interestDue,
      0
    );

  const lastBalance =
    filteredSchedule.length >
    0
      ? filteredSchedule[
          filteredSchedule
            .length - 1
        ].totalOS
      : 0;

  return (

    <div className="min-h-screen bg-gray-100 p-6">

      {/* TITLE */}
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">
        Loan Account Statement
      </h1>

      {/* SUMMARY */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">

        <div className="grid md:grid-cols-6 gap-4 text-center">

          <div>
            <p className="font-semibold text-gray-500">
              Sanctioned Amount
            </p>

            <p className="text-2xl font-bold text-blue-700">
              ₹{loanAmount}
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-500">
              EMI
            </p>

            <p className="text-2xl font-bold text-blue-700">
              ₹{originalEMI}
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-500">
              Int. Due
            </p>

            <p className="text-2xl font-bold text-red-600">
              ₹{totalOverdue}
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-500">
              ROI
            </p>

            <p className="text-2xl font-bold text-blue-700">
              {interestRate}%
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-500">
              EMI Start
            </p>

            <p className="text-xl font-bold text-blue-700">
              {startMonth}
            </p>
          </div>

          <div>
            <p className="font-semibold text-gray-500">
              Outstanding
            </p>

            <p className="text-2xl font-bold text-purple-700">
              ₹{lastBalance}
            </p>
          </div>

        </div>

      </div>

      {/* LOAN DETAILS */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">

        <h2 className="text-2xl font-bold mb-4">
          Loan Details
        </h2>

        <div className="grid md:grid-cols-4 gap-4">

          <input
            type="number"
            value={loanAmount}
            onChange={(e) =>
              setLoanAmount(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            value={interestRate}
            onChange={(e) =>
              setInterestRate(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            value={tenure}
            onChange={(e) =>
              setTenure(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <input
            type="date"
            value={startMonth}
            onChange={(e) =>
              setStartMonth(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

        </div>

        <button
          onClick={
            generateSchedule
          }
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
        >
          Generate EMI Schedule
        </button>

      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">

        <h2 className="text-2xl font-bold mb-4">
          Loan Filters
        </h2>

        {/* RANGE FILTER */}
     {/* RANGE FILTER */}
<div className="mb-8">

  <h3 className="text-xl font-semibold mb-4 text-blue-700">
    Start To End Filter
  </h3>

  <div className="grid md:grid-cols-2 gap-4">

    {/* START MONTH */}
    <select
      value={fromMonth}
      onChange={(e) =>
        setFromMonth(
          e.target.value
        )
      }
      className="border p-3 rounded-xl"
    >

      <option value="">
        Select Start Month
      </option>

      {schedule.map(
        (row) => (

          <option
            key={row.id}
            value={row.month}
          >
            {row.month}
          </option>

        )
      )}

    </select>

    {/* END MONTH */}
    <select
      value={toMonth}
      onChange={(e) =>
        setToMonth(
          e.target.value
        )
      }
      className="border p-3 rounded-xl"
    >

      <option value="">
        Select End Month
      </option>

      {schedule.map(
        (row) => (

          <option
            key={row.id}
            value={row.month}
          >
            {row.month}
          </option>

        )
      )}

    </select>

  </div>

  {/* REVISED EMI SECTION */}
  <div className="mt-6 flex gap-4 flex-wrap">

    <input
      type="number"
      placeholder="Enter Revised EMI"
      value={rangeEMI}
      onChange={(e) =>
        setRangeEMI(
          e.target.value
        )
      }
      className="border p-3 rounded-xl w-64"
    />

    <button
      onClick={
        applyRangeEMI
      }
      className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold"
    >
      Apply EMI To Selected Range
    </button>

  </div>

</div>

  {/* REVISED EMI */}
  <div className="mt-6 flex gap-4 flex-wrap">

    <input
      type="number"
      placeholder="Enter Revised EMI"
      value={rangeEMI}
      onChange={(e) =>
        setRangeEMI(
          e.target.value
        )
      }
      className="border p-3 rounded-xl w-64"
    />

    <button
      onClick={
        applyRangeEMI
      }
      className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-xl font-semibold"
    >
      Apply EMI To Selected Range
    </button>

  </div>

</div>

        {/* RANDOM FILTER */}
        <div>

          <h3 className="text-xl font-semibold mb-4 text-blue-700">
            Custom Random Month Filter
          </h3>

          <div className="grid md:grid-cols-5 gap-4">

            {selectedMonths.map(
              (
                month,
                index
              ) => (

                <div
                  key={index}
                  className="flex gap-2"
                >

                  <input
                    type="text"
                    placeholder="Eg: Jan 25"
                    value={month}
                    onChange={(e) =>
                      updateSelectedMonth(
                        index,
                        e.target.value
                      )
                    }
                    className="border p-3 rounded-xl w-full"
                  />

                  {selectedMonths.length >
                    1 && (

                    <button
                      onClick={() =>
                        removeMonthBox(
                          index
                        )
                      }
                      className="bg-red-500 hover:bg-red-600 text-white px-3 rounded-xl"
                    >
                      X
                    </button>

                  )}

                </div>

              )
            )}

          </div>

          {/* BUTTONS */}
          <div className="flex gap-4 mt-4 flex-wrap">

            <button
              onClick={
                addMonthBox
              }
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl"
            >
              + Add Month
            </button>

            <button
              onClick={
                resetAllFilters
              }
              className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-xl"
            >
              Reset Filter
            </button>

            <button
              onClick={
                resetAllFilters
              }
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl"
            >
              Back To Full Schedule
            </button>

            <button
              onClick={
                handlePrint
              }
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl"
            >
              Print
            </button>

            <button
              onClick={
                exportCSV
              }
              className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-xl"
            >
              Export CSV
            </button>

            <button
              onClick={
                exportPDF
              }
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl"
            >
              Export PDF
            </button>

          </div>

        </div>

      </div>

      {/* EMI TABLE */}
      <div className="bg-white rounded-3xl shadow p-6 overflow-auto">

        <h2 className="text-3xl font-bold text-blue-700 mb-6">
          EMI Schedule
        </h2>

        <table className="min-w-full overflow-hidden rounded-3xl">

          <thead className="bg-blue-600 text-white">

            <tr>

              <th className="p-4">
                Sl. No
              </th>

              <th className="p-4">
                Month
              </th>

              <th className="p-4">
                Opening Balance
              </th>

              <th className="p-4">
                EMI
              </th>

              <th className="p-4">
                Principal
              </th>

              <th className="p-4">
                Interest
              </th>

              <th className="p-4">
                Interest Due
              </th>

              <th className="p-4">
                Balance
              </th>

              <th className="p-4">
                Total O/S
              </th>

              <th className="p-4">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredSchedule.map(
              (
                row,
                displayIndex
              ) => {

                const actualIndex =
                  schedule.findIndex(
                    (item) =>
                      item.id ===
                      row.id
                  );

                return (

                  <tr
                    key={row.id}
                    className="text-center border-b hover:bg-gray-50"
                  >

                    <td className="p-4 font-semibold">
                      {displayIndex + 1}
                    </td>

                    <td className="p-4 font-medium">
                      {row.month}
                    </td>

                    <td className="p-4">
                      ₹{
                        row.openingBalance
                      }
                    </td>

                    <td className="p-4">

                      <input
                        type="number"
                        value={row.emi}
                        onChange={(e) =>
                          updateEMI(
                            actualIndex,
                            e.target.value
                          )
                        }
                        className="border border-gray-300 p-2 rounded-lg w-28 text-center"
                      />

                    </td>

                    <td className="p-4">
                      ₹{row.principal}
                    </td>

                    <td className="p-4">
                      ₹{row.interest}
                    </td>

                    <td className="p-4 text-red-600 font-bold">
                      ₹{
                        row.interestDue
                      }
                    </td>

                    <td className="p-4">
                      ₹{row.balance}
                    </td>

                    <td className="p-4 font-semibold text-purple-700">
                      ₹{row.totalOS}
                    </td>

                    <td className="p-4">

                      <select
                        value={
                          row.status
                        }
                        onChange={(e) =>
                          handleStatusChange(
                            actualIndex,
                            e.target.value
                          )
                        }
                        className="border border-gray-300 p-2 rounded-lg"
                      >

                        <option value="Paid">
                          Paid
                        </option>

                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Overdue">
                          Overdue
                        </option>

                      </select>

                    </td>

                  </tr>

                );
              }
            )}

          </tbody>

        </table>

        {/* TOTAL OUTSTANDING */}
        <div className="flex justify-end mt-10">

          <div className="text-right">

            <h2 className="text-5xl font-bold text-blue-700">

              Outstanding Balance :
              <span className="text-purple-700">

                ₹{lastBalance}

              </span>

            </h2>

          </div>

        </div>

      </div>

    </div>
  );
}

export default App;