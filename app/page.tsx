"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { BarChart3, X } from "lucide-react";

type TabType = "readiness" | "implementation" | "intsfa";

export default function Home() {
  const [tab, setTab] = useState<TabType>("readiness");
  const [loading, setLoading] = useState(true);

  const [readinessData, setReadinessData] = useState<any[]>([]);
  const [implementationData, setImplementationData] = useState<any[]>([]);
  const [intsfaData, setIntsfaData] = useState<any[]>([]);

  const [showChart, setShowChart] = useState(false);

  // ================= FETCH API =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [readinessRes, implementationRes, intsfaRes] =
          await Promise.all([
            fetch("/api/readiness"),
            fetch("/api/implementation"),
            fetch("/api/integrationsfa"),
          ]);

        const readinessJson = await readinessRes.json();
        const implementationJson = await implementationRes.json();
        const intsfaJson = await intsfaRes.json();

        setReadinessData(readinessJson.data || []);
        setImplementationData(implementationJson.data || []);
        setIntsfaData(intsfaJson.data || []);
      } catch (error) {
        console.error("ERROR FETCH API:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ================= HELPERS =================
  const getStatusClass = (status: string) => {
    switch (status) {
      case "NOT STARTED":
      case "NOT READY":
        return "bg-red-100 text-red-600";

      case "READY FOR IMPLEMENTATION":
      case "TRAINING":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-green-100 text-green-700";
    }
  };

  const groupByEntity = (data: any[]) => {
    return Object.entries(
      data.reduce((acc: any, item: any) => {
        const entity = item.entity || "-";

        if (!acc[entity]) {
          acc[entity] = [];
        }

        acc[entity].push(item);

        return acc;
      }, {})
    );
  };

  const createChartData = (grouped: any[]) => {
    return grouped.map(([entity, items]: any) => {
      const avg =
        items.reduce(
          (sum: number, item: any) =>
            sum +
            Number(
              String(item.scoring).replace("%", "") || 0
            ),
          0
        ) / items.length;

      return {
        entity,
        scoring: Number(avg.toFixed(0)),
      };
    });
  };

  // ================= GROUPED DATA =================
  const readinessGrouped = useMemo(
    () => groupByEntity(readinessData),
    [readinessData]
  );

  const implementationGrouped = useMemo(
    () => groupByEntity(implementationData),
    [implementationData]
  );

  const intsfaGrouped = useMemo(
    () => groupByEntity(intsfaData),
    [intsfaData]
  );

  // ================= CHART DATA =================
  const readinessChart = createChartData(readinessGrouped);
  const implementationChart =
    createChartData(implementationGrouped);
  const intsfaChart = createChartData(intsfaGrouped);

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="p-10 text-xl font-semibold">
        Loading...
      </div>
    );
  }

  // ================= CHART MODAL =================
  const ChartModal = ({
    title,
    data,
    onClose,
  }: {
    title: string;
    data: any[];
    onClose: () => void;
  }) => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
      <div className="bg-white w-[90%] max-w-5xl rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">{title}</h2>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="w-full h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis dataKey="entity" />

              <YAxis domain={[0, 100]} />

              <Tooltip />

              <Bar
                dataKey="scoring"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // ================= TAB BUTTON =================
  const TabButton = ({
    value,
    label,
  }: {
    value: TabType;
    label: string;
  }) => (
    <button
      onClick={() => setTab(value)}
      className={`px-4 py-2 rounded-lg font-medium transition ${
        tab === value
          ? "bg-blue-600 text-white"
          : "bg-white border"
      }`}
    >
      {label}
    </button>
  );

  // ================= PAGE HEADER =================
  const PageHeader = ({
    total,
    onShowChart,
  }: {
    total: number;
    onShowChart: () => void;
  }) => (
    <div className="flex items-center gap-3 mb-4">
      <p className="text-sm font-medium">
        Total Distributor: {total}
      </p>

      <button
        onClick={onShowChart}
        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <BarChart3 size={16} />
        Grafik
      </button>
    </div>
  );

  // ================= TABLE WRAPPER =================
  const TableWrapper = ({
    children,
  }: {
    children: React.ReactNode;
  }) => (
    <div className="overflow-auto max-h-[80vh] bg-white rounded-xl shadow">
      <table className="w-max min-w-full text-sm text-gray-900 border-separate border-spacing-0 relative">
        {children}
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      {/* TITLE */}
      <h1 className="text-3xl font-bold text-center mb-6">
        SFA DASHBOARD
      </h1>

      {/* TAB */}
      <div className="flex justify-end gap-2 mb-5">
        <TabButton
          value="readiness"
          label="Readiness"
        />

        <TabButton
          value="implementation"
          label="Implementation"
        />

        <TabButton
          value="intsfa"
          label="Integration SFA"
        />
      </div>

      {/* ================= READINESS ================= */}
      {tab === "readiness" && (
        <>
          <PageHeader
            total={readinessData.length}
            onShowChart={() => setShowChart(true)}
          />

          <TableWrapper>
            <thead className="bg-gray-200 sticky top-0 z-30">
              <tr>
                {[
                  "Entity",
                  "ID",
                  "Branch",
                  "SFA Sales",
                  "SFA Cust",
                  "SFA Prod",
                  "Dist Sales",
                  "Dist Cust",
                  "Dist Prod",
                  "Map Sales",
                  "Map Cust",
                  "Map Prod",
                  "Scoring",
                  "Status",
                ].map((header, index) => (
                  <th
                    key={header}
                    className={`
                      p-3 border-b font-semibold whitespace-nowrap bg-gray-200
                      ${index === 0 ? "sticky left-0 z-40 min-w-[120px]" : ""}
                      ${index === 1 ? "sticky left-[120px] z-40 min-w-[100px]" : ""}
                      ${index === 2 ? "sticky left-[220px] z-40 min-w-[250px]" : ""}
                    `}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {readinessGrouped.map(
                ([entity, items]: any) => {
                  const avg =
                    items.reduce(
                      (sum: number, item: any) =>
                        sum +
                        Number(item.scoring || 0),
                      0
                    ) / items.length;

                  return (
                    <React.Fragment key={entity}>
                      {items.map(
                        (item: any, index: number) => (
                          <tr
                            key={index}
                            className={`border-b ${
                              Number(item.scoring) < 70
                                ? "bg-red-50"
                                : ""
                            }`}
                          >
                            <td
                              className={`p-3 text-center sticky left-0 z-20 min-w-[120px] ${
                                Number(item.scoring) < 70
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.entity}
                            </td>

                            <td
                              className={`p-3 text-center sticky left-[120px] z-20 min-w-[100px] ${
                                Number(item.scoring) < 70
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.id_branch}
                            </td>

                            <td
                              className={`p-3 sticky left-[220px] z-20 min-w-[250px] ${
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
                                className={`px-2 py-1 text-xs rounded-full ${getStatusClass(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        )
                      )}

                      <tr className="bg-blue-100 font-bold">
                        <td
                          colSpan={12}
                          className="p-3 text-center"
                        >
                          RATA-RATA SCORING {entity}
                        </td>

                        <td className="p-3 text-center">
                          {avg.toFixed(0)}%
                        </td>

                        <td />
                      </tr>
                    </React.Fragment>
                  );
                }
              )}
            </tbody>
          </TableWrapper>
        </>
      )}

      {/* ================= IMPLEMENTATION ================= */}
      {tab === "implementation" && (
        <>
          <PageHeader
            total={implementationData.length}
            onShowChart={() => setShowChart(true)}
          />

          <TableWrapper>
            <thead className="bg-gray-200 sticky top-0 z-30">
              <tr>
                {[
                  "Entity",
                  "ID",
                  "Branch",
                  "Rollout",
                  "GoLive",
                  "Input Transaksi",
                  "Transaksi Pertama",
                  "Total Transaksi",
                  "Total Salesman",
                  "Salesman Aktif",
                  "% Salesman",
                  "Status",
                  "Scoring",
                ].map((header, index) => (
                  <th
                    key={header}
                    className={`
                      p-3 border-b whitespace-nowrap bg-gray-200
                      ${index === 0 ? "sticky left-0 z-40 min-w-[120px]" : ""}
                      ${index === 1 ? "sticky left-[120px] z-40 min-w-[100px]" : ""}
                      ${index === 2 ? "sticky left-[220px] z-40 min-w-[250px]" : ""}
                    `}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {implementationGrouped.map(
                ([entity, items]: any) => {
                  const avg =
                    items.reduce(
                      (sum: number, item: any) =>
                        sum +
                        Number(item.scoring || 0),
                      0
                    ) / items.length;

                  return (
                    <React.Fragment key={entity}>
                      {items.map(
                        (item: any, index: number) => (
                          <tr
                            key={index}
                            className={`border-b ${
                              item.status ===
                              "NOT STARTED"
                                ? "bg-red-50"
                                : ""
                            }`}
                          >
                            <td
                              className={`p-3 text-center sticky left-0 z-20 min-w-[120px] ${
                                item.status === "NOT STARTED"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.entity}
                            </td>

                            <td
                              className={`p-3 text-center sticky left-[120px] z-20 min-w-[100px] ${
                                item.status === "NOT STARTED"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.id_branch}
                            </td>

                            <td
                              className={`p-3 sticky left-[220px] z-20 min-w-[250px] ${
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
                              {Number(
                                item.persen_sales
                              ).toFixed(0)}
                              %
                            </td>

                            <td className="p-3">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${getStatusClass(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                            </td>

                            <td className="p-3 text-center font-bold">
                              {Math.round(
                                Number(item.scoring)
                              )}
                              %
                            </td>
                          </tr>
                        )
                      )}

                      <tr className="bg-blue-100 font-bold">
                        <td
                          colSpan={12}
                          className="p-3 text-center"
                        >
                          RATA-RATA SCORING {entity}
                        </td>

                        <td className="p-3 text-center">
                          {avg.toFixed(0)}%
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                }
              )}
            </tbody>
          </TableWrapper>
        </>
      )}

      {/* ================= INTEGRATION SFA ================= */}
      {tab === "intsfa" && (
        <>
          <PageHeader
            total={intsfaData.length}
            onShowChart={() => setShowChart(true)}
          />

          <TableWrapper>
            <thead className="bg-gray-200 sticky top-0 z-30">
              <tr>
                {[
                  "Entity",
                  "ID",
                  "Branch",
                  "Activity",
                  "Status",
                  "Start Date",
                  "End Date",
                  "Scoring",
                ].map((header, index) => (
                  <th
                    key={header}
                    className={`
                      p-3 border-b whitespace-nowrap bg-gray-200
                      ${index === 0 ? "sticky left-0 z-40 min-w-[120px]" : ""}
                      ${index === 1 ? "sticky left-[120px] z-40 min-w-[100px]" : ""}
                      ${index === 2 ? "sticky left-[220px] z-40 min-w-[250px]" : ""}
                    `}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {intsfaGrouped.map(
                ([entity, items]: any) => {
                  const avg =
                    items.reduce(
                      (sum: number, item: any) =>
                        sum +
                        Number(
                          String(
                            item.scoring
                          ).replace("%", "")
                        ),
                      0
                    ) / items.length;

                  return (
                    <React.Fragment key={entity}>
                      {items.map(
                        (item: any, index: number) => (
                          <tr
                            key={index}
                            className={`border-b ${
                              item.status ===
                              "NOT READY"
                                ? "bg-red-50"
                                : ""
                            }`}
                          >
                            <td
                              className={`p-3 text-center sticky left-0 z-20 min-w-[120px] ${
                                item.status === "NOT READY"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.entity}
                            </td>

                            <td
                              className={`p-3 text-center sticky left-[120px] z-20 min-w-[100px] ${
                                item.status === "NOT READY"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.id_branch}
                            </td>

                            <td
                              className={`p-3 sticky left-[220px] z-20 min-w-[250px] ${
                                item.status === "NOT READY"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.branch_name}
                            </td>

                            <td className="p-3">
                              {item.activity}
                            </td>

                            <td className="p-3">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${getStatusClass(
                                  item.status
                                )}`}
                              >
                                {item.status}
                              </span>
                            </td>

                            <td className="p-3 text-center">
                              {item.start_date}
                            </td>

                            <td className="p-3 text-center">
                              {item.end_date}
                            </td>

                            <td className="p-3 text-center font-bold">
                              {item.scoring}
                            </td>
                          </tr>
                        )
                      )}

                      <tr className="bg-blue-100 font-bold">
                        <td
                          colSpan={7}
                          className="p-3 text-center"
                        >
                          RATA-RATA SCORING {entity}
                        </td>

                        <td className="p-3 text-center">
                          {avg.toFixed(0)}%
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                }
              )}
            </tbody>
          </TableWrapper>
        </>
      )}

      {/* ================= MODAL ================= */}
      {showChart && (
        <ChartModal
          title={`Grafik ${
            tab === "readiness"
              ? "Readiness"
              : tab === "implementation"
              ? "Implementation"
              : "Integration SFA"
          }`}
          data={
            tab === "readiness"
              ? readinessChart
              : tab === "implementation"
              ? implementationChart
              : intsfaChart
          }
          onClose={() => setShowChart(false)}
        />
      )}
    </div>
  );
}