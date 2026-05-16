import React, { useState } from "react";

function App() {

  const [loanAmount, setLoanAmount] =
    useState(100000);

  const [interestRate, setInterestRate] =
    useState(11);

  const [tenure, setTenure] =
    useState(12);

  const [startMonth, setStartMonth] =
    useState("2024-02-01");

  const [schedule, setSchedule] =
    useState([]);

  const [originalEMI, setOriginalEMI] =
    useState(0);

  // FILTER STATES
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

    let balance =
      index === 0
        ? Number(
            loanAmount
          )
        : Number(
            updated[
              index - 1
            ].balance
          );

    for (
      let i = index;
      i < updated.length;
      i++
    ) {

      const emi =
        Number(
          updated[i].emi
        );

      const interest =
        Math.round(
          (balance *
            interestRate) /
            12 /
            100
        );

      const principal =
        emi > interest
          ? emi -
            interest
          : 0;

      const newBalance =
        emi > interest
          ? Math.max(
              0,
              balance -
                principal
            )
          : balance;

      updated[
        i
      ].openingBalance =
        Math.round(
          balance
        );

      updated[i].interest =
        interest;

      updated[
        i
      ].principal =
        principal;

      updated[i].balance =
        Math.round(
          newBalance
        );

      balance =
        newBalance;
    }

    setSchedule(updated);
  };

  // STATUS LOGIC
  const handleStatusChange = (
    originalIndex,
    value
  ) => {

    const updated = [
      ...schedule,
    ];

    updated[
      originalIndex
    ].status = value;

    let previousDue = 0;

    for (
      let i = 0;
      i < updated.length;
      i++
    ) {

      const row =
        updated[i];

      const previousBalance =
        i === 0
          ? Number(
              loanAmount
            )
          : updated[
              i - 1
            ].balance;

      const currentInterest =
        row.interest;

      // PAID
      if (
        row.status ===
        "Paid"
      ) {

        row.carryForwardDue = 0;

        row.interestDue = 0;

        row.principal =
          row.emi -
          currentInterest;

        row.balance =
          previousBalance -
          row.principal;

        previousDue = 0;
      }

      // PENDING
      else if (
        row.status ===
        "Pending"
      ) {

        row.carryForwardDue =
          previousDue;

        row.interestDue =
          previousDue +
          currentInterest;

        row.principal = 0;

        row.balance =
          previousBalance;

        previousDue =
          row.interestDue;
      }

      // OVERDUE
      else if (
        row.status ===
        "Overdue"
      ) {

        row.carryForwardDue =
          previousDue;

        row.interestDue =
          previousDue +
          currentInterest;

        row.principal = 0;

        row.balance =
          previousBalance;

        previousDue =
          row.interestDue;
      }
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
  const totalOutstanding =
    filteredSchedule.reduce(
      (sum, row) =>
        sum +
        row.balance +
        row.interestDue,
      0
    );

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
        sum +
        (row.status ===
        "Paid"
          ? row.emi
          : 0),
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
        row.status ===
          "Overdue" ||
        row.status ===
          "Pending"
    ).length;

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* TITLE */}
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-8">
        EMI & Outstanding
        Loan Management
        System
      </h1>

      {/* LOAN DETAILS */}
      <div className="bg-white p-6 rounded-2xl shadow mb-8">

        <h2 className="text-2xl font-bold mb-4">
          Loan Details
        </h2>

        <div className="grid md:grid-cols-4 gap-4">

          <div>

            <label className="block font-semibold mb-2">
              Loan Amount
            </label>

            <input
              type="number"
              value={
                loanAmount
              }
              onChange={(e) =>
                setLoanAmount(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl"
            />

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Interest Rate
            </label>

            <input
              type="number"
              value={
                interestRate
              }
              onChange={(e) =>
                setInterestRate(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl"
            />

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Tenure
            </label>

            <input
              type="number"
              value={tenure}
              onChange={(e) =>
                setTenure(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl"
            />

          </div>

          <div>

            <label className="block font-semibold mb-2">
              Start Date
            </label>

            <input
              type="date"
              value={
                startMonth
              }
              onChange={(e) =>
                setStartMonth(
                  e.target.value
                )
              }
              className="w-full border p-3 rounded-xl"
            />

          </div>

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

      {/* DASHBOARD */}
      {schedule.length > 0 && (
        <>

          <div className="grid md:grid-cols-5 gap-4 mb-8">

            <div className="bg-white p-5 rounded-2xl shadow">

              <h3 className="text-gray-500">
                Monthly EMI
              </h3>

              <p className="text-3xl font-bold text-blue-600">
                ₹{
                  originalEMI
                }
              </p>

            </div>

            <div className="bg-white p-5 rounded-2xl shadow">

              <h3 className="text-gray-500">
                Outstanding
                Balance
              </h3>

              <p className="text-3xl font-bold text-red-600">
                ₹{
                  totalOutstanding
                }
              </p>

            </div>

            <div className="bg-white p-5 rounded-2xl shadow">

              <h3 className="text-gray-500">
                Total Interest
              </h3>

              <p className="text-3xl font-bold text-green-600">
                ₹{
                  totalInterest
                }
              </p>

            </div>

            <div className="bg-white p-5 rounded-2xl shadow">

              <h3 className="text-gray-500">
                Total Paid
              </h3>

              <p className="text-3xl font-bold text-purple-600">
                ₹{
                  totalPaid
                }
              </p>

            </div>

            <div className="bg-white p-5 rounded-2xl shadow">

              <h3 className="text-gray-500">
                Overdue
                Summary
              </h3>

              <p className="text-2xl font-bold text-orange-600">
                ₹{
                  totalOverdue
                }
              </p>

              <p className="text-sm text-gray-500 mt-2">
                {
                  overdueMonths
                }{" "}
                Month(s)
                Due
              </p>

            </div>

          </div>

          {/* FILTER SECTION */}
          <div className="bg-white p-6 rounded-2xl shadow mb-8">

            <h2 className="text-2xl font-bold mb-4">
              Filter Time Period
            </h2>

            <div className="grid md:grid-cols-2 gap-4">

              {/* FROM */}
              <select
                className="p-3 border rounded-xl"
                value={fromMonth}
                onChange={(e) =>
                  setFromMonth(
                    e.target.value
                  )
                }
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

              {/* TO */}
              <select
                className="p-3 border rounded-xl"
                value={toMonth}
                onChange={(e) =>
                  setToMonth(
                    e.target.value
                  )
                }
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

            {/* BACK BUTTON */}
            {fromMonth &&
              toMonth && (

                <div className="mt-4">

                  <button
                    onClick={() => {

                      setFromMonth("");
                      setToMonth("");

                    }}
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl"
                  >
                    Back To Full
                    Schedule
                  </button>

                </div>

              )}

          </div>

          {/* TABLE */}
          <div className="overflow-x-auto bg-white rounded-2xl shadow">

            <table className="w-full">

              <thead className="bg-blue-600 text-white">

                <tr>

                  <th className="p-4">
                    Sl. No
                  </th>

                  <th className="p-4">
                    Month
                  </th>

                  <th className="p-4">
                    Opening
                    Balance
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
                    Carry
                    Forward
                    Due
                  </th>

                  <th className="p-4">
                    Interest
                    Due
                  </th>

                  <th className="p-4">
                    Outstanding
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
                        className="text-center border-b"
                      >

                        <td className="p-4">
                          {row.id}
                        </td>

                        <td className="p-4">
                          {
                            row.month
                          }
                        </td>

                        <td className="p-4">
                          ₹
                          {
                            row.openingBalance
                          }
                        </td>

                        {/* EMI */}
                        <td className="p-4">

                          <input
                            type="number"
                            value={
                              row.emi
                            }
                            className="border p-2 rounded-lg w-24"
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
                          />

                        </td>

                        {/* PRINCIPAL */}
                        <td className="p-4">
                          ₹
                          {
                            row.principal
                          }
                        </td>

                        {/* INTEREST */}
                        <td className="p-4">
                          ₹
                          {
                            row.interest
                          }
                        </td>

                        {/* CARRY FORWARD */}
                        <td className="p-4 text-orange-600 font-bold">
                          ₹
                          {
                            row.carryForwardDue
                          }
                        </td>

                        {/* INTEREST DUE */}
                        <td className="p-4 text-red-600 font-bold">
                          ₹
                          {
                            row.interestDue
                          }
                        </td>

                        {/* OUTSTANDING */}
                        <td className="p-4 font-bold text-blue-600">
                          ₹
                          {row.balance +
                            row.interestDue}
                        </td>

                        {/* STATUS */}
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

        </>
      )}

    </div>
  );
}

export default App;