import React, { useState } from "react";

function App() {
  const [loanAmount, setLoanAmount] = useState(100000);
  const [interestRate, setInterestRate] = useState(11);
  const [tenure, setTenure] = useState(12);

  const [startMonth, setStartMonth] =
    useState("2025-01-01");

  const [schedule, setSchedule] = useState([]);

  const [fromMonth, setFromMonth] = useState("");
  const [toMonth, setToMonth] = useState("");

  // EMI Formula
  const calculateEMI = (P, annualRate, N) => {
    const R = annualRate / 12 / 100;

    const emi =
      (P * R * Math.pow(1 + R, N)) /
      (Math.pow(1 + R, N) - 1);

    return Math.round(emi);
  };

  // Generate EMI Schedule
  const generateSchedule = () => {
    let balance = Number(loanAmount);

    const emi = calculateEMI(
      balance,
      interestRate,
      tenure
    );

    let data = [];

    const start = new Date(startMonth);

    for (let i = 0; i < tenure; i++) {
      const interest = Math.round(
        (balance * interestRate) / 12 / 100
      );

      const principal = emi - interest;

      const newBalance = Math.max(
        0,
        balance - principal
      );

      const monthDate = new Date(start);

      monthDate.setMonth(start.getMonth() + i);

      data.push({
        id: i + 1,

        month: monthDate.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        }),

        openingBalance: balance,

        emi,

        principal,

        interest,

        balance: Math.round(newBalance),

        status: "Paid",
      });

      balance = newBalance;
    }

    setSchedule(data);
  };

  // Update EMI
  const updateEMI = (index, value) => {
    const updated = [...schedule];

    updated[index].emi = Number(value);

    let balance =
      index === 0
        ? Number(loanAmount)
        : Number(updated[index - 1].balance);

    for (let i = index; i < updated.length; i++) {
      const emi = Number(updated[i].emi);

      const interest = Math.round(
        (balance * interestRate) / 12 / 100
      );

      const principal = emi - interest;

      const newBalance = Math.max(
        0,
        balance - principal
      );

      updated[i].openingBalance =
        Math.round(balance);

      updated[i].interest = interest;

      updated[i].principal = principal;

      updated[i].balance =
        Math.round(newBalance);

      balance = newBalance;
    }

    setSchedule(updated);
  };

  // Filter Schedule
  const filteredSchedule = schedule.filter(
    (row) => {
      if (!fromMonth || !toMonth) return true;

      const currentIndex =
        schedule.indexOf(row);

      const fromIndex = schedule.findIndex(
        (r) => r.month === fromMonth
      );

      const toIndex = schedule.findIndex(
        (r) => r.month === toMonth
      );

      return (
        currentIndex >= fromIndex &&
        currentIndex <= toIndex
      );
    }
  );

  // Totals
  const totalOutstanding =
    filteredSchedule.length > 0
      ? filteredSchedule[
          filteredSchedule.length - 1
        ].balance
      : 0;

  const totalInterest =
    filteredSchedule.reduce(
      (sum, row) =>
        sum + Number(row.interest),
      0
    );

  const totalPaid =
    filteredSchedule.reduce(
      (sum, row) =>
        sum + Number(row.emi),
      0
    );

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* Title */}
      <h1 className="text-4xl font-bold text-center mb-8 text-blue-700">
        EMI & Outstanding Loan Management
        System
      </h1>

      {/* Loan Inputs */}
      <div className="bg-white p-6 rounded-2xl shadow mb-8">

        <h2 className="text-2xl font-bold mb-4">
          Loan Details
        </h2>

        <div className="grid md:grid-cols-4 gap-4">

          {/* Loan Amount */}
          <div>
            <label className="block mb-2 font-semibold">
              Loan Amount
            </label>

            <input
              type="number"
              placeholder="Loan Amount"
              className="p-3 border rounded-xl w-full"
              value={loanAmount}
              onChange={(e) =>
                setLoanAmount(e.target.value)
              }
            />
          </div>

          {/* Interest Rate */}
          <div>
            <label className="block mb-2 font-semibold">
              Interest Rate (%)
            </label>

            <input
              type="number"
              placeholder="Interest Rate"
              className="p-3 border rounded-xl w-full"
              value={interestRate}
              onChange={(e) =>
                setInterestRate(
                  e.target.value
                )
              }
            />
          </div>

          {/* Tenure */}
          <div>
            <label className="block mb-2 font-semibold">
              Tenure (Months)
            </label>

            <input
              type="number"
              placeholder="Tenure"
              className="p-3 border rounded-xl w-full"
              value={tenure}
              onChange={(e) =>
                setTenure(e.target.value)
              }
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block mb-2 font-semibold">
              Start Date
            </label>

            <input
              type="date"
              className="p-3 border rounded-xl w-full"
              value={startMonth}
              onChange={(e) =>
                setStartMonth(
                  e.target.value
                )
              }
            />
          </div>

        </div>

        <button
          onClick={generateSchedule}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
        >
          Generate EMI Schedule
        </button>

      </div>

      {/* Dashboard */}
      {schedule.length > 0 && (
        <>

          <div className="grid md:grid-cols-4 gap-4 mb-8">

            <div className="bg-white p-5 rounded-2xl shadow">
              <h3 className="text-gray-500">
                Monthly EMI
              </h3>

              <p className="text-3xl font-bold text-blue-600">
                ₹{schedule[0].emi}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow">
              <h3 className="text-gray-500">
                Outstanding Balance
              </h3>

              <p className="text-3xl font-bold text-red-600">
                ₹{totalOutstanding}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow">
              <h3 className="text-gray-500">
                Total Interest
              </h3>

              <p className="text-3xl font-bold text-green-600">
                ₹{totalInterest}
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow">
              <h3 className="text-gray-500">
                Total Paid
              </h3>

              <p className="text-3xl font-bold text-purple-600">
                ₹{totalPaid}
              </p>
            </div>

          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-2xl shadow mb-8">

            <h2 className="text-2xl font-bold mb-4">
              Filter Time Period
            </h2>

            <div className="grid md:grid-cols-2 gap-4">

              <select
                className="p-3 border rounded-xl"
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

              <select
                className="p-3 border rounded-xl"
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

          </div>

          {/* EMI Table */}
          <div className="overflow-x-auto bg-white rounded-2xl shadow">

            <table className="w-full border-collapse">

              <thead className="bg-blue-600 text-white">

                <tr>
                  <th className="p-3">
                    Month
                  </th>

                  <th className="p-3">
                    Opening Balance
                  </th>

                  <th className="p-3">
                    EMI
                  </th>

                  <th className="p-3">
                    Principal
                  </th>

                  <th className="p-3">
                    Interest
                  </th>

                  <th className="p-3">
                    Outstanding
                  </th>

                  <th className="p-3">
                    Status
                  </th>
                </tr>

              </thead>

              <tbody>

                {filteredSchedule.map(
                  (row) => {

                    const originalIndex =
                      schedule.findIndex(
                        (r) =>
                          r.id === row.id
                      );

                    return (

                      <tr
                        key={row.id}
                        className="text-center border-b"
                      >

                        <td className="p-3">
                          {row.month}
                        </td>

                        <td className="p-3">
                          ₹{
                            row.openingBalance
                          }
                        </td>

                        <td className="p-3">

                          <input
                            type="number"
                            value={row.emi}
                            className="border p-2 rounded-lg w-24"
                            onChange={(e) =>
                              updateEMI(
                                originalIndex,
                                e.target.value
                              )
                            }
                          />

                        </td>

                        <td className="p-3">
                          ₹{row.principal}
                        </td>

                        <td className="p-3">
                          ₹{row.interest}
                        </td>

                        <td className="p-3 font-bold text-blue-600">
                          ₹{row.balance}
                        </td>

                        <td className="p-3">

                          <select
                            className="border p-2 rounded-lg"
                            value={row.status}
                            onChange={(e) => {
                              const updated = [
                                ...schedule,
                              ];

                              updated[
                                originalIndex
                              ].status =
                                e.target.value;

                              setSchedule(
                                updated
                              );
                            }}
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