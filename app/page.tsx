"use client";

import { useEffect, useState } from "react";
import React from "react";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,} from "recharts";
import { BarChart3, X } from "lucide-react";

export default function Home() {
  //state untuk tab navigatornya
  const [tab, setTab] = useState<"readiness" | "implementation">(
    "readiness"
  );

  //simpan data dari api
  const [readinessData, setReadinessData] = useState<any[]>([]);
  const [implementationData, setImplementationData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true); //loading halaman
  const [showChart, setShowChart] = useState(false); //chart readiness
  const [showImplementationChart, setShowImplementationChart] = useState(false); //chart implementation

  //fetch api
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [readinessRes, implementationRes] =
          await Promise.all([
            fetch("/api/readiness"), //ngambil dari file route.ts folder readiness
            fetch("/api/implementation"), //ngambil dari file route.ts folder implementation
          ]);

        //mengubah respones api yg data[] itu jadi object js
        const readinessJson = await readinessRes.json();
        const implementationJson = await implementationRes.json();

        // console.log("READINESS:", readinessJson);
        // console.log("IMPLEMENTATION:", implementationJson);
        //menyimpan data yg berupa array itu ke state, jika data kosong tetap disimpan di array kosong
        setReadinessData(readinessJson.data || []);
        setImplementationData(implementationJson.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-10 text-xl">Loading...</div>;
  }

  // ================= GROUP READINESS =================
  //mengelompokkan berdasarkan entity
  const groupedData = Object.entries(
    readinessData.reduce((acc: any, item: any) => {
      const entity = item.entity || "-";
      if (!acc[entity]) {
        acc[entity] = [];
      }
      acc[entity].push(item);
      return acc;
    }, {})
  );

  // ================= CHART DATA =================

  const chartData = groupedData.map(
    ([entity, items]: any) => {
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
    }
  );

  // ================= STATUS BADGE =================

  const renderStatus = (status: string) => {
    if (status === "NOT STARTED") {
      return "bg-red-100 text-red-600";
    }

    if (status === "READY FOR IMPLEMENTATION") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "TRAINING") {
      return "bg-yellow-100 text-yellow-700";
    }

    return "bg-green-100 text-green-700";
  };

  // ================= READINESS =================
  //isi tampilan di tab readiness
  const renderReadiness = () => (
    <>
      <div className="mb-3 flex items-center gap-3">
        <p className="text-sm">
          Total Distributor: {readinessData.length}
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
            {groupedData.map(([entity, items]: any) => {
              const avgScoring =
                items.reduce(
                  (sum: number, x: any) =>
                    sum + Number(x.scoring || 0),
                  0
                ) / items.length;

              return (
                <React.Fragment key={entity}>

                  {/* DETAIL ROW */}
                  {items.map((item: any, idx: number) => (
                    <tr
                      key={`${entity}-${idx}`}
                      className={`border-b ${
                        Number(item.scoring) < 70
                          ? "bg-red-50"
                          : ""
                      }`}
                    >

                      <td
                        className={`p-3 sticky left-0 z-40 min-w-[90px] text-center ${
                          Number(item.scoring) < 70
                            ? "bg-red-50"
                            : "bg-white"
                        }`}
                      >
                        {item.entity}
                      </td>

                      <td
                        className={`p-3 sticky left-[90px] z-40 min-w-[100px] text-center ${
                          Number(item.scoring) < 70
                            ? "bg-red-50"
                            : "bg-white"
                        }`}
                      >
                        {item.id_branch}
                      </td>

                      <td
                        className={`p-3 sticky left-[190px] z-40 min-w-[250px] ${
                          Number(item.scoring) < 70
                            ? "bg-red-50"
                            : "bg-white"
                        }`}
                      >
                        {item.branch_name}
                      </td>

                      <td className="p-3 text-center">
                        {item.mastersfa_salesman}
                      </td>

                      <td className="p-3 text-center">
                        {item.mastersfa_cust}
                      </td>

                      <td className="p-3 text-center">
                        {item.prodsfa}
                      </td>

                      <td className="p-3 text-center">
                        {item.masterdist_sls}
                      </td>

                      <td className="p-3 text-center">
                        {item.masterdist_cust}
                      </td>

                      <td className="p-3 text-center">
                        {item.masterdist_prod}
                      </td>

                      <td className="p-3 text-center">
                        {item.map_sales}
                      </td>

                      <td className="p-3 text-center">
                        {item.map_cust}
                      </td>

                      <td className="p-3 text-center">
                        {item.map_prod}
                      </td>

                      <td className="p-3 text-center font-bold">
                        {Math.round(
                          Number(item.scoring)
                        )}
                        %
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${renderStatus(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {/* AVG ROW */}
                  <tr className="bg-blue-100 font-bold border-b">
                    <td
                      colSpan={12}
                      className="p-3 text-center"
                    >
                      RATA-RATA SCORING {entity}
                    </td>

                    <td className="p-3 text-center">
                      {avgScoring.toFixed(0)}%
                    </td>

                    <td />
                  </tr>

                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  // ================= IMPLEMENTATION =================

const implementationGrouped = Object.entries(
  implementationData.reduce((acc: any, item: any) => {
    const entity = item.entity || "-";

    if (!acc[entity]) {
      acc[entity] = [];
    }

    acc[entity].push(item);

    return acc;
  }, {})
);

const implementationChartData = implementationGrouped.map(
  ([entity, items]: any) => {
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
  }
);



const renderImplementation = () => (
  <>
    <div className="mb-3 flex items-center gap-3">
      <p className="text-sm">
        Total Distributor: {implementationData.length}
      </p>

      <button
        onClick={() => setShowImplementationChart(true)}
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
              Rollout
            </th>

            <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
              GoLive
            </th>

            <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
              Input Transaksi
            </th>

            <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
              Transaksi Pertama
            </th>

            <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
              Total Transaksi
            </th>

            <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
              Total Salesman
            </th>

            <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
              Salesman Aktif
            </th>

            <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
              % Salesman
            </th>

            <th className="p-3 sticky top-0 bg-gray-200 min-w-[200px]">
              Status
            </th>

            <th className="p-3 sticky top-0 bg-gray-200 min-w-[120px]">
              Scoring
            </th>

          </tr>
        </thead>

        {/* BODY */}
        <tbody>
          {implementationGrouped.map(
            ([entity, items]: any) => {
              const avgScoring =
                items.reduce(
                  (sum: number, x: any) =>
                    sum + Number(x.scoring || 0),
                  0
                ) / items.length;

              return (
                <React.Fragment key={entity}>

                  {items.map((item: any, idx: number) => (
                    <tr
                      key={`${entity}-${idx}`}
                      className={`border-b ${
                        item.status === "NOT STARTED"
                          ? "bg-red-50"
                          : ""
                      }`}
                    >

                      <td
                        className={`p-3 sticky left-0 z-40 min-w-[90px] text-center ${
                          item.status === "NOT STARTED"
                            ? "bg-red-50"
                            : "bg-white"
                        }`}
                      >
                        {item.entity}
                      </td>

                      <td
                        className={`p-3 sticky left-[90px] z-40 min-w-[100px] text-center ${
                          item.status === "NOT STARTED"
                            ? "bg-red-50"
                            : "bg-white"
                        }`}
                      >
                        {item.id_branch}
                      </td>

                      <td
                        className={`p-3 sticky left-[190px] z-40 min-w-[250px] ${
                          item.status === "NOT STARTED"
                            ? "bg-red-50"
                            : "bg-white"
                        }`}
                      >
                        {item.branch_name}
                      </td>

                      <td className="p-3 text-center">
                        {item.rollout}
                      </td>

                      <td className="p-3 text-center">
                        {item.golive}
                      </td>

                      <td className="p-3 text-center">
                        {item.input_transaksi}
                      </td>

                      <td className="p-3 text-center">
                        {item.first_trans}
                      </td>

                      <td className="p-3 text-center">
                        {item.total_trans}
                      </td>

                      <td className="p-3 text-center">
                        {item.useraktif}
                      </td>

                      <td className="p-3 text-center">
                        {item.salesman_aktif}
                      </td>

                      <td className="p-3 text-center">
                        {Number(item.persen_sales).toFixed(0)}%
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${renderStatus(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="p-3 font-bold text-center">
                        {Math.round(
                          Number(item.scoring)
                        )}
                        %
                      </td>

                    </tr>
                  ))}

                  {/* AVG ROW */}
                  <tr className="bg-blue-100 font-bold border-b">

                    <td
                      colSpan={12}
                      className="p-3 text-center"
                    >
                      RATA-RATA SCORING {entity}
                    </td>

                    <td className="p-3 text-center">
                      {avgScoring.toFixed(0)}%
                    </td>

                  </tr>

                </React.Fragment>
              );
            }
          )}
        </tbody>
      </table>
    </div>

    {/* CHART */}
    {showImplementationChart && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">

        <div className="bg-white w-[90%] max-w-4xl rounded-2xl p-6 shadow-xl">

          <div className="flex justify-between items-center mb-4">

            <h2 className="text-xl font-bold">
              Grafik Rata-rata Scoring Implementation
            </h2>

            <button
              onClick={() =>
                setShowImplementationChart(false)
              }
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>

          </div>

          <div className="w-full h-[400px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={implementationChartData}>

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
  </>
);

  return (
    <div className="p-6 bg-gray-100 min-h-screen text-gray-900">

      <h1 className="text-2xl font-bold mb-6 text-center">
        SFA DASHBOARD
      </h1>

      {/* TAB */}
      <div className="flex justify-end gap-2 mb-4">
  <button
    onClick={() => setTab("readiness")}
    className={`px-4 py-2 rounded-lg font-medium ${
      tab === "readiness"
        ? "bg-blue-600 text-white"
        : "bg-white border"
    }`}
  >
    Readiness
  </button>

  <button
    onClick={() => setTab("implementation")}
    className={`px-4 py-2 rounded-lg font-medium ${
      tab === "implementation"
        ? "bg-blue-600 text-white"
        : "bg-white border"
    }`}
  >
    Implementation
  </button>
</div>

      {/* CONTENT */}
      {tab === "readiness"
        ? renderReadiness()
        : renderImplementation()}

      {/* CHART MODAL */}
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
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
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