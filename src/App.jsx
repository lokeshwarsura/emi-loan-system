import React, { useState } from "react";

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

  // MEMBER DETAILS
  const [memberName, setMemberName] =
    useState("");

  const [bacNo, setBacNo] =
    useState("");

  const [caseNo, setCaseNo] =
    useState("");

  const [loanType, setLoanType] =
    useState("");

  const [unit, setUnit] =
    useState("");

  // SCHEDULE
  const [schedule, setSchedule] =
    useState([]);

  const [originalEMI, setOriginalEMI] =
    useState(0);

  // FILTERS
  const [fromMonth, setFromMonth] =
    useState("");

  const [toMonth, setToMonth] =
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

  // GENERATE SCHEDULE
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

    updated[index].emi =
      Number(value);

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

  // RECALCULATE FULL SCHEDULE
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

      // PAID
      if (
        row.status ===
        "Paid"
      ) {

        row.carryForwardDue = 0;

        row.interestDue = 0;

        row.principal =
          row.emi -
          interest;

        row.balance =
          Math.max(
            0,
            previousBalance -
              row.principal
          );

        previousDue = 0;
      }

      // PENDING / OVERDUE
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

  // FILTER LOGIC
  const filteredSchedule =
    schedule.filter((row) => {

      if (
        !fromMonth ||
        !toMonth
      )
        return true;

      const currentIndex =
        schedule.indexOf(row);

      const fromIndex =
        schedule.findIndex(
          (r) =>
            r.month === fromMonth
        );

      const toIndex =
        schedule.findIndex(
          (r) =>
            r.month === toMonth
        );

      return (
        currentIndex >= fromIndex &&
        currentIndex <= toIndex
      );
    });

  // TOTALS
  const totalInterest =
    filteredSchedule.reduce(
      (sum, row) =>
        sum +
        row.interest,
      0
    );

  const totalPaid =
    filteredSchedule.reduce(
      (sum, row) =>
        row.status ===
        "Paid"
          ? sum + row.emi
          : sum,
      0
    );

  const totalOverdue =
    filteredSchedule.reduce(
      (sum, row) =>
        sum +
        row.interestDue,
      0
    );

  const overdueMonths =
    filteredSchedule.filter(
      (row) =>
        row.status !==
        "Paid"
    ).length;

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

      {/* TOP SUMMARY */}
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
            placeholder="Loan Amount"
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
            placeholder="Interest Rate"
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
            placeholder="Tenure"
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
          Generate EMI
          Schedule
        </button>

      </div>

      {/* MEMBER DETAILS */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">

        <h2 className="text-2xl font-bold mb-4">
          Member Details
        </h2>

        <div className="grid md:grid-cols-5 gap-4">

          <input
            type="text"
            placeholder="Member Name"
            value={memberName}
            onChange={(e) =>
              setMemberName(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="BAC No"
            value={bacNo}
            onChange={(e) =>
              setBacNo(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="Case No"
            value={caseNo}
            onChange={(e) =>
              setCaseNo(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="Loan Type"
            value={loanType}
            onChange={(e) =>
              setLoanType(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

          <input
            type="text"
            placeholder="Unit"
            value={unit}
            onChange={(e) =>
              setUnit(
                e.target.value
              )
            }
            className="border p-3 rounded-xl"
          />

        </div>

      </div>

      {/* FILTER */}
      <div className="bg-white rounded-2xl shadow p-6 mb-8">

        <h2 className="text-2xl font-bold mb-4">
          Filter Time Period
        </h2>

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
              Select From Month
            </option>

            {schedule.map((row) => (

              <option
                key={row.id}
                value={row.month}
              >
                {row.month}
              </option>

            ))}

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
              Select To Month
            </option>

            {schedule.map((row) => (

              <option
                key={row.id}
                value={row.month}
              >
                {row.month}
              </option>

            ))}

          </select>

        </div>

        {fromMonth &&
          toMonth && (

            <button
              onClick={() => {

                setFromMonth("");
                setToMonth("");

              }}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl"
            >
              Back To Full
              Schedule
            </button>

          )}

      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow">

        <table className="w-full text-center">

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
                index
              ) => {

                const originalIndex =
                  schedule.findIndex(
                    (r) =>
                      r.id ===
                      row.id
                  );

                return (

                  <tr
                    key={row.id}
                    className="border-b"
                  >

                    <td className="p-4">
                      {row.id}
                    </td>

                    <td className="p-4">
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
                        onChange={(
                          e
                        ) =>
                          updateEMI(
                            originalIndex,
                            e
                              .target
                              .value
                          )
                        }
                        className="border p-2 rounded-lg w-24"
                      />

                    </td>

                    <td className="p-4">
                      ₹{
                        row.principal
                      }
                    </td>

                    <td className="p-4">
                      ₹{
                        row.interest
                      }
                    </td>

                    <td className="p-4 text-red-600 font-bold">
                      ₹{
                        row.interestDue
                      }
                    </td>

                    <td className="p-4 text-blue-700 font-bold">
                      ₹{
                        row.balance
                      }
                    </td>

                    <td className="p-4 text-pink-600 font-bold">
                      ₹{
                        row.totalOS
                      }
                    </td>

                    <td className="p-4">

                      <select
                        value={
                          row.status
                        }
                        onChange={(
                          e
                        ) =>
                          handleStatusChange(
                            originalIndex,
                            e
                              .target
                              .value
                          )
                        }
                        className="border p-2 rounded-lg"
                      >

                        <option>
                          Paid
                        </option>

                        <option>
                          Pending
                        </option>

                        <option>
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

      </div>

      {/* FINAL BALANCE */}
      <div className="text-right text-3xl font-bold text-blue-700 mt-8">
        Outstanding Balance :
        ₹{lastBalance}
      </div>

    </div>
  );
}

export default App;