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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, X, Check, XCircle } from "lucide-react";

type TabType = "readiness" | "implementation" | "intsfa" | "intdms";

export default function Home() {
  const [tab, setTab] = useState<TabType>("readiness");
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [statusFilter, setStatusFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  const [readinessData, setReadinessData] = useState<any[]>([]);
  const [implementationData, setImplementationData] = useState<any[]>([]);
  const [intsfaData, setIntsfaData] = useState<any[]>([]);
  const [intdmsData, setIntdmsData] = useState<any[]>([]);

  const [showStatusChart, setShowStatusChart] = useState(false);
  const [showEntityChart, setShowEntityChart] = useState(false);

  

  // ================= FETCH API =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [readinessRes, implementationRes, intsfaRes, intdmsRes] =
          await Promise.all([
            fetch("/api/readiness"),
            fetch("/api/implementation"),
            fetch("/api/integrationsfa"),
            fetch("/api/integrationdms"),
          ]);

        const readinessJson = await readinessRes.json();
        const implementationJson = await implementationRes.json();
        const intsfaJson = await intsfaRes.json();
        const intdmsJson = await intdmsRes.json();

        setReadinessData(readinessJson.data || []);
        setImplementationData(implementationJson.data || []);
        setIntsfaData(intsfaJson.data || []);
        setIntdmsData(intdmsJson.data || []);
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
      case "PROGRESS":
        return "bg-yellow-100 text-yellow-700";

      case "DONE" : return "bg-blue-100 text-blue-700";

      default:
        return "bg-green-100 text-green-700";
    }
  };

  

  const renderIcon = (value: number) => {
  return Number(value) === 1 ? (
    <div className="flex justify-center">
      <Check
        size={20}
        className="text-green-600 font-bold"
      />
    </div>
  ) : (
    <div className="flex justify-center">
      <XCircle
        size={20}
        className="text-red-600"
      />
    </div>
  );
};

const filterAndSortData = (data: any[]) => {
  let result = [...data];

  // Search
if (search) {
  const keyword = search.toLowerCase();

  result = result.filter((item) =>
    Object.values(item).some((value) =>
      String(value)
        .toLowerCase()
        .includes(keyword)
    )
  );
}

  // Filter Entity
  if (entityFilter) {
    result = result.filter(
      (item) => item.entity === entityFilter
    );
  }

  // Filter Status
  if (statusFilter) {
    result = result.filter(
      (item) => item.status === statusFilter
    );
  }

  // Sort
  if (sortField) {
    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (!isNaN(valA) && !isNaN(valB)) {
        return sortDirection === "asc"
          ? Number(valA) - Number(valB)
          : Number(valB) - Number(valA);
      }

      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  return result;
};

const handleSort = (field: string) => {
  if (sortField !== field) {
    // klik pertama
    setSortField(field);
    setSortDirection("asc");
  } else if (sortDirection === "asc") {
    // klik kedua
    setSortDirection("desc");
  } else {
    // klik ketiga = reset
    setSortField("");
    setSortDirection("asc");
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
const readinessGrouped = useMemo(() => {
  const data = filterAndSortData(readinessData);

  return sortField === "status"
    ? [["ALL", data]]
    : groupByEntity(data);
}, [
  readinessData,
  search,
  statusFilter,
  entityFilter,
  sortField,
  sortDirection,
]);

const implementationGrouped = useMemo(() => {
  const data = filterAndSortData(implementationData);

  return sortField === "status"
    ? [["ALL", data]]
    : groupByEntity(data);
}, [
  implementationData,
  search,
  statusFilter,
  entityFilter,
  sortField,
  sortDirection,
]);

const intsfaGrouped = useMemo(() => {
  const data = filterAndSortData(intsfaData);

  return sortField === "status"
    ? [["ALL", data]]
    : groupByEntity(data);
}, [
  intsfaData,
  search,
  statusFilter,
  entityFilter,
  sortField,
  sortDirection,
]);

const intdmsGrouped = useMemo(() => {
  const data = filterAndSortData(intdmsData);

  return sortField === "status"
    ? [["ALL", data]]
    : groupByEntity(data);
}, [
  intdmsData,
  search,
  statusFilter,
  entityFilter,
  sortField,
  sortDirection,
]);



  // ================= CHART DATA =================
  const readinessChart = createChartData(readinessGrouped);
  const implementationChart = createChartData(implementationGrouped);
  const intsfaChart = createChartData(intsfaGrouped);
  const intdmsChart = createChartData(intdmsGrouped);
  

  const currentData =
  tab === "readiness"
    ? readinessData
    : tab === "implementation"
    ? implementationData
    : tab === "intsfa"
    ? intsfaData
    : intdmsData;

    const totalDistributor = currentData.length;
    const filteredCurrentData = filterAndSortData(currentData);

const countData = filteredCurrentData.length;

const statusChartData = Object.entries(
  currentData.reduce((acc: any, item: any) => {
    const status = item.status || "Unknown";

    acc[status] = (acc[status] || 0) + 1;

    return acc;
  }, {})
).map(([status, value]) => ({
  name: status,
  value,
}));

const PIE_COLORS = [
  "#22c55e",
  "#facc15",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
];

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

  //toolbar search dan filter

  <div className="flex flex-wrap gap-3 mb-5">

  <input
    type="text"
    placeholder="Search branch / entity / id..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border rounded-lg px-3 py-2 w-72"
  />
</div>

  // ================= PAGE HEADER =================
const PageHeader = ({
  total,
  count,
}: {
  total: number;
  count: number;
}) => (
  <div className="flex items-center gap-3 mb-4">
    <p className="text-sm font-medium">
      Total Distributor: {total}
    </p>

    <button
      onClick={() => setShowStatusChart(true)}
      className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
    >
      📊 Status Chart
    </button>

    <button
      onClick={() => setShowEntityChart(true)}
      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
    >
      📈 Entity Scoring
    </button>

    {/* Count Data di kanan */}
    <div className="ml-auto px-3 py-2 bg-gray-100 rounded-lg font-medium">
      Count Data: {count}
    </div>
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
          label="SFA Outbond"
        />

        <TabButton
          value="intdms"
          label="SFA Inbound"
        />
      </div>
        {/* SEARCH & FILTER */}
<div className="flex flex-wrap gap-3 mb-5">
  <input
    type="text"
    placeholder="Search branch / entity / id..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="border rounded-lg px-3 py-2 w-72 bg-white"
  />
</div>
      {/* ================= READINESS ================= */}
      {tab === "readiness" && (
        <>
          <PageHeader
  total={readinessData.length}
  count={filterAndSortData(readinessData).length}
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
  "Rute",
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
  onClick={() => {
    if (header === "Status") {
      handleSort("status");
    }
  }}
  className={`
    p-3 border-b font-semibold whitespace-nowrap bg-gray-200
    ${
      header === "Status"
        ? "cursor-pointer hover:bg-gray-300"
        : ""
    }
    ${index === 0 ? "sticky left-0 z-40 min-w-[120px]" : ""}
    ${index === 1 ? "sticky left-[120px] z-40 min-w-[100px]" : ""}
    ${index === 2 ? "sticky left-[220px] z-40 min-w-[250px]" : ""}
  `}
>
  {header}
  {header === "Status" &&
  (sortField === "status"
    ? sortDirection === "asc"
      ? " ↑"
      : " ↓"
    : " ↕")}
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
                              {item.rute}
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

                            <td className="p-3 text-center">
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
                          colSpan={13}
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
  count={filterAndSortData(implementationData).length}
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
  onClick={() => {
    if (header === "Status") {
      handleSort("status");
    }
  }}
  className={`
    p-3 border-b font-semibold whitespace-nowrap bg-gray-200
    ${
      header === "Status"
        ? "cursor-pointer hover:bg-gray-300"
        : ""
    }
    ${index === 0 ? "sticky left-0 z-40 min-w-[120px]" : ""}
    ${index === 1 ? "sticky left-[120px] z-40 min-w-[100px]" : ""}
    ${index === 2 ? "sticky left-[220px] z-40 min-w-[250px]" : ""}
  `}
>
  {header}
  {header === "Status" &&
  (sortField === "status"
    ? sortDirection === "asc"
      ? " ↑"
      : " ↓"
    : " ↕")}
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

                            <td className="p-3 text-center">
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
  count={filterAndSortData(intsfaData).length}
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
  onClick={() => {
    if (header === "Status") {
      handleSort("status");
    }
  }}
  className={`
    p-3 border-b font-semibold whitespace-nowrap bg-gray-200
    ${
      header === "Status"
        ? "cursor-pointer hover:bg-gray-300"
        : ""
    }
    ${index === 0 ? "sticky left-0 z-40 min-w-[120px]" : ""}
    ${index === 1 ? "sticky left-[120px] z-40 min-w-[100px]" : ""}
    ${index === 2 ? "sticky left-[220px] z-40 min-w-[250px]" : ""}
  `}
>
  {header}
  {header === "Status" &&
  (sortField === "status"
    ? sortDirection === "asc"
      ? " ↑"
      : " ↓"
    : " ↕")}
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

                            <td className="p-3 text-center">
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

            {/* ================= INTEGRATION DMS ================= */}
      {tab === "intdms" && (
        <>
          <PageHeader
  total={intdmsData.length}
  count={filterAndSortData(intdmsData).length}
/>
          <TableWrapper>
            <thead className="bg-gray-200 sticky top-0 z-30">
              <tr>
                {[
                  "Entity",
                  "ID",
                  "Branch",
                  "Config TO",
                  "Config Stok",
                  "Config Invoice",
                  "Data Stok",
                  "Data Invoice",
                  "Scoring",
                  "Status"
                ].map((header, index) => (
                  <th
  key={header}
  onClick={() => {
    if (header === "Status") {
      handleSort("status");
    }
  }}
  className={`
    p-3 border-b font-semibold whitespace-nowrap bg-gray-200
    ${
      header === "Status"
        ? "cursor-pointer hover:bg-gray-300"
        : ""
    }
    ${index === 0 ? "sticky left-0 z-40 min-w-[120px]" : ""}
    ${index === 1 ? "sticky left-[120px] z-40 min-w-[100px]" : ""}
    ${index === 2 ? "sticky left-[220px] z-40 min-w-[250px]" : ""}
  `}
>
  {header}
  {header === "Status" &&
  (sortField === "status"
    ? sortDirection === "asc"
      ? " ↑"
      : " ↓"
    : " ↕")}
</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {intdmsGrouped.map(
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

                            <td className="p-3 text-center">
                              {renderIcon(item.configto)}
                            </td>

                            <td className="p-3 text-center">
                              {renderIcon(item.configstk)}
                            </td>

                            <td className="p-3 text-center">
                              {renderIcon(item.configinv)}
                            </td>

                            <td className="p-3 text-center">
                              {renderIcon(item.datastk)}
                            </td>

                            <td className="p-3 text-center">
                              {renderIcon(item.datainv)}
                            </td>

                          
                            <td className="p-3 text-center font-bold">
                              {Math.round(
                                Number(item.scoring)
                              )}
                              %
                            </td>

                            <td className="p-3 text-center">
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
                          colSpan={9}
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
{showStatusChart && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
    <div className="bg-white w-[700px] rounded-2xl p-6">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold">
          Status Chart
        </h2>

        <button
          onClick={() => setShowStatusChart(false)}
        >
          <X />
        </button>
      </div>

      <div className="h-[450px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie
  data={statusChartData}
  dataKey="value"
  nameKey="name"
  outerRadius={140}
  label={({ name, value }) => {
    const percentage = (
      ((value as number) / totalDistributor) *
      100
    ).toFixed(0);

    return `${name}: ${percentage}%`;
  }}
>
              {statusChartData.map(
                (_, index) => (
                  <Cell
                    key={index}
                    fill={
                      PIE_COLORS[
                        index % PIE_COLORS.length
                      ]
                    }
                  />
                )
              )}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}

{showEntityChart && (
  <ChartModal
    title="Scoring Per Entity"
    data={
      tab === "readiness"
        ? readinessChart
        : tab === "implementation"
        ? implementationChart
        : tab === "intsfa"
        ? intsfaChart
        : intdmsChart
    }
    onClose={() =>
      setShowEntityChart(false)
    }
  />
)}
    </div>
  );
}