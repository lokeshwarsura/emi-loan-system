import { useState } from "react";
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

  const [selectedMonths, setSelectedMonths] =
    useState([""]);

  const [bulkEMI, setBulkEMI] =
    useState("");

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

    recalculateSchedule(
      updated
    );
  };

  // STATUS CHANGE
  const handleStatusChange = (
    index,
    value
  ) => {

    const updated = [
      ...schedule,
    ];

    updated[index].status =
      value;

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

  // APPLY BULK EMI IN FILTERED RANGE
  const applyBulkEMI = () => {

    if (!bulkEMI || isNaN(bulkEMI)) return;

    const revisedEMIValue = Number(bulkEMI);

    const filteredIds = new Set(
      filteredSchedule.map((r) => r.id)
    );

    const updated = schedule.map((row) => {

      if (filteredIds.has(row.id)) {

        const updatedRow = {
          ...row,
          emi: revisedEMIValue,
        };

        if (revisedEMIValue === 0) {

          updatedRow.status = "Overdue";
        }

        else if (
          updatedRow.status === "Overdue"
        ) {

          updatedRow.status = "Paid";
        }

        return updatedRow;
      }

      return row;
    });

    recalculateSchedule(updated);
    setBulkEMI("");
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

    <div className={`relative min-h-screen p-6 md:p-8 overflow-hidden transition-all duration-1000 ${totalOverdue > 0
        ? "bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-100"
        : "bg-gradient-to-br from-slate-50 via-indigo-50/20 to-slate-100"
      }`}>

      {/* Reactive Floating Ambient Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[130px] opacity-40 animate-blob transition-all duration-1000 ${totalOverdue > 0 ? "bg-rose-400" : "bg-blue-400"
          }`}></div>
        <div className={`absolute top-1/3 -right-20 w-[450px] h-[450px] rounded-full blur-[150px] opacity-35 animate-blob animation-delay-2000 transition-all duration-1000 ${totalOverdue > 0 ? "bg-amber-300" : "bg-purple-400"
          }`}></div>
        <div className={`absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full blur-[130px] opacity-30 animate-blob animation-delay-4000 transition-all duration-1000 ${totalOverdue > 0 ? "bg-red-300" : "bg-emerald-300"
          }`}></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* TITLE */}
        <h1 className="text-5xl font-extrabold text-center mb-10 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-800">
          Loan Account Statement
        </h1>

        {/* SUMMARY */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/40 shadow-xl shadow-slate-100/50 p-6 mb-8 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">

            <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-xl p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-white/70 flex flex-col justify-between">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                Sanctioned Amount
              </p>
              <p className="text-2xl font-black text-blue-700">
                ₹{loanAmount}
              </p>
            </div>

            <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-xl p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-white/70 flex flex-col justify-between">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                EMI
              </p>
              <p className="text-2xl font-black text-indigo-600">
                ₹{originalEMI}
              </p>
            </div>

            <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-xl p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-white/70 flex flex-col justify-between relative overflow-hidden">
              {totalOverdue > 0 && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
              <p className="text-sm font-semibold text-slate-500 mb-1">
                Int. Due
              </p>
              <p className={`text-2xl font-black ${totalOverdue > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                ₹{totalOverdue}
              </p>
            </div>

            <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-xl p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-white/70 flex flex-col justify-between">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                ROI
              </p>
              <p className="text-2xl font-black text-teal-600">
                {interestRate}%
              </p>
            </div>

            <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-xl p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-white/70 flex flex-col justify-between">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                EMI Start
              </p>
              <p className="text-lg font-bold text-slate-700">
                {startMonth}
              </p>
            </div>

            <div className="backdrop-blur-md bg-white/40 border border-white/20 rounded-xl p-4 shadow-sm transition-all duration-300 hover:scale-105 hover:bg-white/70 flex flex-col justify-between">
              <p className="text-sm font-semibold text-slate-500 mb-1">
                Outstanding
              </p>
              <p className="text-2xl font-black text-purple-700">
                ₹{lastBalance}
              </p>
            </div>

          </div>

        </div>

        {/* LOAN DETAILS */}
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/40 shadow-xl shadow-slate-100/50 p-6 mb-8 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">

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
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/40 shadow-xl shadow-slate-100/50 p-6 mb-8 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">

          <h2 className="text-2xl font-bold mb-4">
            Loan Filters
          </h2>

          {/* RANGE FILTER */}
          <div className="mb-8">

            <h3 className="text-xl font-semibold mb-4 text-blue-700">
              Start To End Filter
            </h3>

            <div className="grid md:grid-cols-2 gap-4">

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

            {/* BULK REVISE EMI SECTION */}
            {schedule.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-200/50">
                <h3 className="text-xl font-bold mb-3 text-indigo-700 flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
                  </span>
                  Bulk Revise EMI in Filtered Range
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Enter a new EMI value to apply to all <span className="font-semibold text-indigo-600">{filteredSchedule.length} months</span> currently matching your active filters.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-medium">₹</span>
                    <input
                      type="number"
                      placeholder="New EMI Amount"
                      value={bulkEMI}
                      onChange={(e) => setBulkEMI(e.target.value)}
                      className="pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-200 w-44"
                    />
                  </div>
                  <button
                    onClick={applyBulkEMI}
                    disabled={filteredSchedule.length === 0}
                    className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                  >
                    Apply EMI to Filtered Months
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* EMI TABLE */}
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl border border-white/40 shadow-xl shadow-slate-100/50 p-6 overflow-auto transition-all duration-300 hover:shadow-2xl hover:shadow-slate-200/50">

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

    </div>
  );
}

export default App;