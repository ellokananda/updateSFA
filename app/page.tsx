"use client";

import { useEffect, useState } from "react";
import React from "react";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,} from "recharts";
import { BarChart3, X } from "lucide-react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => {
        console.log("API RESULT:", res);

        setData(res.data || []);
      })
      .catch((err) => {
        console.error("API ERROR:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-10 text-xl">Loading...</div>;
  }

  const groupedData = Object.entries(
    data.reduce((acc: any, item: any) => {
      const entity = item.entity;

      if (!acc[entity]) {
        acc[entity] = [];
      }

      acc[entity].push(item);

      return acc;
    }, {})
  );

  const chartData = groupedData.map(([entity, items]: any) => {
  const avgScoring =
    items.reduce(
      (sum: number, x: any) =>
        sum + Number(x.scoring || 0),
      0
    ) / items.length;

  return {
    entity,
    scoring: Number(avgScoring.toFixed(0)),
  };
});

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-gray-900">
      <h1 className="text-2xl font-bold mb-6">
        MASTER DATA READINESS
      </h1>

      <div className="mb-3 flex items-center gap-3">
  <p className="text-sm">
    Total Distributor: {data.length}
  </p>

  <button
    onClick={() => setShowChart(true)}
    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
  >
    <BarChart3 size={16} />
    Grafik
  </button>
</div>

      <div className="overflow-auto max-h-[80vh] bg-white rounded-xl shadow">
        <table className="w-max min-w-full text-sm text-gray-900 border-separate border-spacing-0">
          
{/* HEADER */}
<thead className="bg-gray-200">
  <tr className="border-b text-gray-800">

    <th className="p-3 sticky top-0 left-0 z-50 bg-gray-200 min-w-[90px]">
      Entity
    </th>

    <th className="p-3 sticky top-0 left-[90px] z-50 bg-gray-200 min-w-[100px]">
      ID
    </th>

    <th className="p-3 sticky top-0 left-[190px] z-50 bg-gray-200 min-w-[250px]">
      Branch
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
      SFA Sales
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
      SFA Cust
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
      SFA Prod
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
      Dist Sales
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
      Dist Cust
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
      Dist Prod
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
      Map Sales
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
      Map Cust
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
      Map Prod
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
      Scoring
    </th>

    <th className="p-3 sticky top-0 bg-gray-200 min-w-[200px]">
      Status
    </th>

  </tr>
</thead>

          {/* BODY */}
          <tbody>
            {groupedData.map(([entity, items]: any, i) => {
              const avgScoring =
                items.reduce(
                  (sum: number, x: any) =>
                    sum + Number(x.scoring || 0),
                  0
                ) / items.length;

              return (
                <React.Fragment key={entity}>
                  {/* ROW DATA */}
                  {items.map((item: any, idx: number) => (
                    <tr
                      key={`${entity}-${item.id_branch}-${idx}`}
                      className={`border-b ${
                        Number(item.scoring) < 70
                          ? "bg-red-50"
                          : ""
                      }`}
                    >
                      <td
                      className={`p-3 sticky left-0 z-40 min-w-[90px] text-center ${
                        Number(item.scoring) < 70 ? "bg-red-50" : "bg-white"
                      }`}
                    >
                      {item.entity}
                    </td>

                    <td
                      className={`p-3 sticky left-[90px] z-40 min-w-[100px] text-center ${
                        Number(item.scoring) < 70 ? "bg-red-50" : "bg-white"
                      }`}
                    >
                      {item.id_branch}
                    </td>

                    <td
                      className={`p-3 sticky left-[190px] z-40 min-w-[250px] text-gray-800 ${
                        Number(item.scoring) < 70 ? "bg-red-50" : "bg-white"
                      }`}
                    >
                      {item.branch_name}
                    </td>

                      <td className="p-3 text-center">{item.mastersfa_salesman}</td>
                      <td className="p-3 text-center">{item.mastersfa_cust}</td>
                      <td className="p-3 text-center">{item.prodsfa}</td>

                      <td className="p-3 text-center">{item.masterdist_sls}</td>
                      <td className="p-3 text-center">{item.masterdist_cust}</td>
                      <td className="p-3 text-center">{item.masterdist_prod}</td>

                      <td className="p-3 text-center">{item.map_sales}</td>
                      <td className="p-3 text-center">{item.map_cust}</td>
                      <td className="p-3 text-center">{item.map_prod}</td>

                      <td className="p-3 font-bold text-center">
                        {Math.round(Number(item.scoring))}%
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            item.status === "NOT STARTED"
                              ? "bg-red-100 text-red-600"
                              : item.status ===
                                "READY FOR IMPLEMENTATION"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* ROW AVERAGE ENTITY */}
                  <tr className="bg-blue-100 font-bold border-b">
                    <td colSpan={12} className="p-3 text-center">
                      RATA-RATA SCORING {entity}
                    </td>
                    <td className="p-3">
                      {avgScoring.toFixed(0)}%
                    </td>
                    <td></td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {showChart && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
    <div className="bg-white w-[90%] max-w-4xl rounded-2xl p-6 shadow-xl">
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">
          Grafik Rata-rata Scoring per Entity
        </h2>

        <button
          onClick={() => setShowChart(false)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="entity" />

            <YAxis domain={[0, 100]} />

            <Tooltip />

            <Bar
              dataKey="scoring"
              fill="#06b6d4"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}
    </div>
  );
}