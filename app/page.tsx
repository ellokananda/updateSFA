"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid,PieChart,Pie,Cell,Legend,} from "recharts";
import { X, Check, XCircle, Info } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type TabType = "readiness" | "implementation" | "intsfa" | "intdms" | "summary";

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
    const [summaryData, setSummaryData] = useState<any[]>([]);

  const [showStatusChart, setShowStatusChart] = useState(false);
  const [showEntityChart, setShowEntityChart] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);
  const scrollPosition = useRef(0);

  const [showInfo, setShowInfo] = useState(false);

  

  // ================= FETCH API =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [readinessRes, implementationRes, intsfaRes, intdmsRes, summaryRes] =
          await Promise.all([
            fetch("/api/readiness"),
            fetch("/api/implementation"),
            fetch("/api/integrationsfa"),
            fetch("/api/integrationdms"),
            fetch("/api/summary")
          ]);

        const readinessJson = await readinessRes.json();
        const implementationJson = await implementationRes.json();
        const intsfaJson = await intsfaRes.json();
        const intdmsJson = await intdmsRes.json();
        const summaryJson = await summaryRes.json();

        setReadinessData(readinessJson.data || []);
        setImplementationData(implementationJson.data || []);
        setIntsfaData(intsfaJson.data || []);
        setIntdmsData(intdmsJson.data || []);
        setSummaryData(summaryJson.data || []);
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
  if (tableRef.current) {
    scrollPosition.current =
      tableRef.current.scrollLeft;
  }

  if (sortField !== field) {
    setSortField(field);
    setSortDirection("asc");
  } else if (sortDirection === "asc") {
    setSortDirection("desc");
  } else {
    setSortField("");
    setSortDirection("asc");
  }
};

useEffect(() => {
  requestAnimationFrame(() => {
    if (tableRef.current) {
      tableRef.current.scrollLeft =
        scrollPosition.current;
    }
  });
}, [sortField, sortDirection]);

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

const summaryGrouped = useMemo(() => {
  const data = filterAndSortData(summaryData);

  return sortField === "status"
    ? [["ALL", data]]
    : groupByEntity(data);
}, [
  summaryData,
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
  const summaryChart = createChartData(summaryGrouped);
  

  const currentData =
  tab === "readiness"
    ? readinessData
    : tab === "implementation"
    ? implementationData
    : tab === "intsfa"
    ? intsfaData
    : tab === "intdms"
    ? intdmsData
    : summaryData;

    const totalDistributor = currentData.length;
    const filteredCurrentData = filterAndSortData(currentData);
    const totalRollout =
  readinessData.filter(
    (item) => String(item.rollout).toUpperCase() === "Y"
  ).length;

const totalGoLive =
  readinessData.filter(
    (item) => String(item.golive).toUpperCase() === "Y"
  ).length;

// const countData = filteredCurrentData.length;

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

const readinessColumnInfo: Record<string, string> = {
  Entity: "Kode entity distributor",
  ID: "Kode branch distributor",
  Branch: "Nama distributor",
  "SFA Sales": "Jumlah salesman dengan id SFA",
  "SFA Cust": "Jumlah Outlet dengan id SFA",
  "SFA Prod": "Jumlah produk dengan id SFA",
  Rute: "Jumlah route yang sudah tersedia di SFA",
  "Dist Sales": "Jumlah salesman dengan id distributor",
  "Dist Cust": "Jumlah customer dengan id distributor",
  "Dist Prod": "Jumlah produk dengan id distributor",
  "Map Sales": "Mapping salesman",
  "Map Cust": "Mapping customer",
  "Map Prod": "Mapping produk",
  Scoring: "Persentase kesiapan",
    Status: `READY FOR INTEGRATION : Seluruh master data dan mapping telah siap untuk proses integrasi
  READY FOR IMPLEMENTATION : Master Data SFA dan Rute sudah ada untuk proses implementasi
  NOT READY : Master Data, Mapping Data, dan Rute belum lengkap`
};

const implementationColumnInfo: Record<string, string> = {
  Entity: "Kode entity distributor",
  ID: "Kode branch distributor",
  Branch: "Nama distributor",
  "Rollout": "Tanggal Rollout",
  "GoLive": "Tanggal GoLive",
  "Input Transaksi": "Apakah Distributor sudah melakukan inputan taking order",
  "Transaksi Pertama": "Tanggal pertama kali adanya inputan taking order",
  "Total Transaksi": "Jumlah keseluruhan transaksi",
  "Total Salesman": "Total Salesman",
  "Salesman Aktif": "Salesman yang aktif selama bulan berjalan",
  "% Salesman": "Persentase salesman aktif",
  Status: `GO LIVE : Implementasi SFA telah berjalan dengan transaksi aktif dan penggunaan sistem oleh salesman
  TRAINING : Dalam alam proses training dan persiapan penggunaan SFA
  NOT STARTED : Implementasi SFA belum dimulai dan belum memasuki tahap training`,
  Scoring: "Persentase kesiapan"
};

const intsfaColumnInfo: Record<string, string> = {
  Entity: "Kode entity distributor",
  ID: "Kode branch distributor",
  Branch: "Nama distributor",
  "Start Date": "Tanggal Dimulai Proses Integrasi SFA-DMS",
  "End Data": "Tanggal Selesai Proses Integrasi SFA-DMS",
  Activity: `Running : Proses input taking order ke DMS Distributor
  Template Output Belum Disepakati : Belum proses Integrasi
  Konfigurasi : Proses setup dan konfigurasi integrasi sedang dilakukan`,
  Status: `DONE : Data Taking Order H-1 telah tersedia
  PROGRESS : Konfigurasi Taking Order telah selesai dibuat
  NOT READY : Konfigurasi Taking Order belum dibuat`,
  Scoring: "Persentase kesiapan"
};

const intdmsColumnInfo: Record<string, string> = {
  Entity: "Kode entity distributor",
  ID: "Kode branch distributor",
  Branch: "Nama distributor",
  "Config TO": "Cek Konfigurasi Taking Order apa sudah ada",
  "Config Stok": "Cek Konfigurasi Stok apa sudah ada",
  "Config Invoice": "Cek Konfigurasi Sales Invoice apa sudah ada",
  "Data Stok": "Data Stok dalam 7 hari kebelakang",
  "Data Invoice": "Data Sales Invoice dalam 7 hari kebelakang",
  "Stock Last Date": "Tanggal Terakhir Supply Data Stok",
  "Invoice Last Date ": "Tanggal Terakhir Supply Data Sales Invoice",
  Status: `DONE : Konfigurasi, data stok, dan data sales invoice telah terkirim secara rutin selama 7 hari terakhir
  PROGRESS : Konfigurasi telah lengkap, namun pengiriman data stok dan/atau data sales invoice belum terpenuhi sepenuhnya
  READY : Konfigurasi Taking Order, Stok, dan Sales Invoice telah lengkap dan siap untuk proses integrasi
  NOT READY : Konfigurasi Taking Order, Stok, dan/atau Sales Invoice belum lengkap`,
  Scoring: "Persentase kesiapan"
};

const statusInfo = {
  readiness: [
    {
      status: "READY FOR INTEGRATION",
      desc: "Seluruh master data dan mapping telah siap untuk proses integrasi."
    },
    {
      status: "READY FOR IMPLEMENTATION",
      desc: "Master Data SFA dan Rute sudah ada untuk proses implementasi"
    },
    {
      status: "NOT READY",
      desc: "Master Data, Mapping Data, dan Rute belum lengkap."
    },
  ],

  implementation: [
    {
      status: "GO LIVE",
      desc: "Implementasi SFA telah berjalan dengan transaksi aktif dan penggunaan sistem oleh salesman"
    },
    {
      status: "TRAINING",
      desc: "Dalam alam proses training dan persiapan penggunaan SFA"
    },
    {
      status: "NOT STARTED",
      desc: "Implementasi SFA belum dimulai dan belum memasuki tahap training"
    },
  ],

  intsfa: [
    {
      status: "DONE",
      desc: "Data Taking Order telah tersedia"
    },
    {
      status: "PROGRESS",
      desc: "Konfigurasi Taking Order telah selesai dibuat"
    },
    {
      status: "NOT READY",
      desc: "Konfigurasi Taking Order telah belum dibuat"
    },
  ],

  intdms: [
  {
    status: "DONE",
    desc: "Konfigurasi, data stok, dan data sales invoice telah terkirim secara rutin selama 7 hari terakhir."
  },
  {
    status: "PROGRESS",
    desc: "Konfigurasi telah lengkap, namun pengiriman data stok dan/atau data sales invoice belum terpenuhi sepenuhnya."
  },
  {
    status: "READY",
    desc: "Konfigurasi Taking Order, Stok, dan Sales Invoice telah lengkap dan siap untuk proses integrasi."
  },
  {
    status: "NOT READY",
    desc: "Konfigurasi Taking Order, Stok, dan/atau Sales Invoice belum lengkap."
  },
],
summary: [],
};

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
      className={`
  px-3 md:px-4
  py-2
  text-sm md:text-base
  rounded-lg
  font-medium
  transition-all
  duration-200
  ${
    tab === value
      ? "bg-blue-600 text-white shadow-md"
      : "bg-white border hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600"
  }
`}
    >
      {label}
    </button>
  );

  //toolbar search dan filter

//   <div className="flex flex-wrap gap-3 mb-5">
//   <input
//     type="text"
//     placeholder="Search branch / entity / id..."
//     value={search}
//     onChange={(e) => setSearch(e.target.value)}
//     className="border rounded-lg px-3 py-2 w-72"
//   />
// </div>

const exportToExcel = () => {
  let exportData: any[] = [];
  let sheetName = "";

  if (tab === "readiness") {
    sheetName = "Readiness";

    exportData = filterAndSortData(readinessData).map((item) => ({
      Entity: item.entity,
      ID: item.id_branch,
      Branch: item.branch_name,
      "SFA Sales": item.mastersfa_salesman,
      "SFA Cust": item.mastersfa_cust,
      "SFA Prod": item.prodsfa,
      Rute: item.rute,
      "Dist Sales": item.masterdist_sls,
      "Dist Cust": item.masterdist_cust,
      "Dist Prod": item.masterdist_prod,
      "Map Sales": item.map_sales,
      
      "Map Cust": item.map_cust,
      "Map Prod": item.map_prod,
      Scoring: `${Math.round(Number(item.scoring))}%`,
      Status: item.status,
    }));
  }

  else if (tab === "implementation") {
    sheetName = "Implementation";

    exportData = filterAndSortData(implementationData).map((item) => ({
      Entity: item.entity,
      ID: item.id_branch,
      Branch: item.branch_name,
      Rollout: item.rollout,
      GoLive: item.golive,
      "Input Transaksi": item.input_transaksi,
      "Transaksi Pertama": item.first_trans,
      "Total Transaksi": item.total_trans,
      "Total Salesman": item.useraktif,
      "Salesman Aktif": item.salesman_aktif,
      "% Salesman": `${Number(item.persen_sales).toFixed(0)}%`,
      Status: item.status,
      Scoring: `${Math.round(Number(item.scoring))}%`,
    }));
  }

  else if (tab === "intsfa") {
    sheetName = "SFA Outbound";

    exportData = filterAndSortData(intsfaData).map((item) => ({
      Entity: item.entity,
      ID: item.id_branch,
      Branch: item.branch_name,
      Activity: item.activity,
      Status: item.status,
      "Start Date": item.start_date,
      "End Date": item.end_date,
      Scoring: item.scoring,
    }));
  }

  else if (tab === "intdms") {
    sheetName = "SFA Inbound";

    exportData = filterAndSortData(intdmsData).map((item) => ({
      Entity: item.entity,
      ID: item.id_branch,
      Branch: item.branch_name,
"Config TO": Number(item.configto) === 1 ? "✔" : "✘",
"Config Stock": Number(item.configstk) === 1 ? "✔" : "✘",
"Config Invoice": Number(item.configinv) === 1 ? "✔" : "✘",
"Data Stock": Number(item.datastk) === 1 ? "✔" : "✘",
"Data Invoice": Number(item.datainv) === 1 ? "✔" : "✘",
"Stock Last Date" : item.tgl_terakhir_stok,
"Invoice Last Date" : item.tgl_terakhir_invoice,
      Scoring: `${Math.round(Number(item.scoring))}%`,
      Status: item.status,
    }));
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    sheetName
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const today = new Date().toISOString().split("T")[0];

  saveAs(
    blob,
    `SFA-${sheetName}-${today}.xlsx`
  );
};

  // ================= PAGE HEADER =================
const PageHeader = ({
  total,
  count,
}: {
  total: number;
  count: number;
}) => (
  <div className="flex flex-col md:flex-row gap-3 mb-4 items-center">
  <div className="px-3 py-2 bg-gray-100 rounded-lg font-medium text-sm">
    Total Distributor: {total}
  </div>

  {tab === "readiness" && (
  <>
    <div className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium text-sm">
      Total Distri Rollout dan GoLive: {totalRollout}
    </div>

    {/* <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
      Go Live: {totalGoLive}
    </div> */}
  </>
)}

  <button
    onClick={() => setShowStatusChart(true)}
    className="
      px-3 py-2
      bg-emerald-600
      text-white
      rounded-lg
      text-sm
      font-medium
      hover:bg-blue-100
      hover:text-blue-700
      transition-all
      duration-200
    "
  >
    📊 Status Chart
  </button>

  <button
    onClick={() => setShowEntityChart(true)}
    className="
      px-3 py-2
      bg-emerald-600
      text-white
      rounded-lg
      text-sm
      font-medium
      hover:bg-blue-100
      hover:text-blue-700
      transition-all
      duration-200
    "
  >
    📈 Entity Scoring
  </button>

  <button
    onClick={exportToExcel}
    className="
      px-3 py-2
      bg-emerald-600
      text-white
      rounded-lg
      text-sm
      font-medium
      hover:bg-blue-100
      hover:text-blue-700
      transition-all
      duration-200
    "
  >
    📥 Export Excel
  </button>

{search.trim() !== "" && (
  <div className="md:ml-auto px-3 py-2 bg-gray-100 rounded-lg font-medium text-sm">
    Count Data: {count}
  </div>
)}
</div>
);



  // ================= TABLE WRAPPER =================
const TableWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => (
  <div
    ref={tableRef}
    className="overflow-x-auto overflow-y-auto max-h-[80vh] bg-white rounded-xl shadow"
  >
<table className="w-max min-w-full text-xs md:text-sm text-gray-900 border-separate border-spacing-0 relative">
      {children}
    </table>
  </div>
);

const HeaderTooltip = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="flex items-center justify-center gap-1">
    <span>{title}</span>

    <div className="relative group">
      <Info
        size={14}
        className="text-gray-500 cursor-help"
      />

<div
  className="
    invisible
    group-hover:visible
    absolute
    z-[9999]
    top-full
    left-1/2
    -translate-x-1/2
    mt-2

    w-64
    max-w-xs

    p-3
    text-xs
    text-white
    bg-gray-800
    rounded-lg
    shadow-lg

    whitespace-pre-line
    break-words
  "
>
        {description}
      </div>
    </div>
  </div>
);

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-6 text-gray-900">
      {/* TITLE */}
      <div className="flex justify-center items-center gap-2 mb-6">
  <h1 className="text-2xl md:text-3xl font-bold">
    SFA DASHBOARD
  </h1>

  {/* <button
    onClick={() => setShowInfo(true)}
    className="
      w-6 h-6
      rounded-full
      bg-gray-500
      text-white
      text-sm
      flex items-center justify-center
      hover:bg-blue-100
      hover:text-blue-700
    "
  >
    i
  </button> */}
</div>

      {/* TAB */}
      <div className="flex flex-wrap justify-center md:justify-end gap-2 mb-5">
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

        <TabButton
          value="summary"
          label="Summary"
        />
      </div>
        {/* SEARCH & FILTER */}
<div className="flex flex-wrap gap-3 mb-5">
  <div className="relative w-full md:w-72">
    <input
      type="text"
      placeholder="Search ..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="
        border rounded-lg px-3 py-2 pr-10
        w-full
        bg-white
      "
    />

    {search && (
      <button
        type="button"
        onClick={() => setSearch("")}
        className="
          absolute right-3 top-1/2
          -translate-y-1/2
          text-gray-400
          hover:text-red-500
        "
      >
        <X size={16} />
      </button>
    )}
  </div>
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
        ? "cursor-pointer hover:bg-gray-300 w-[350px]"
        : ""
    }
    ${index === 0 ? "md:sticky md:left-0 md:z-40 min-w-[120px]" : ""}
    ${index === 1 ? "md:sticky md:left-[120px] md:z-40 min-w-[100px]" : ""}
    ${index === 2 ? "md:sticky md:left-[220px] md:z-40 min-w-[250px]" : ""}
  `}
>
  <div className="flex items-center justify-center gap-1">
    <HeaderTooltip
      title={header}
      description={
        readinessColumnInfo[header] || "Tidak ada keterangan"
      }
    />

    {header === "Status" && (
      <span className="ml-1">
        {sortField === "status"
          ? sortDirection === "asc"
            ? "↑"
            : "↓"
          : "↕"}
      </span>
    )}
  </div>
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
                              className={`p-3 text-center md:sticky md:left-0 md:z-20 min-w-[120px] ${
                                Number(item.scoring) < 70
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.entity}
                            </td>

                            <td
                              className={`p-3 text-center md:sticky md:left-[120px] md:z-20 min-w-[100px] ${
                                Number(item.scoring) < 70
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.id_branch}
                            </td>

                            <td
                              className={`p-3 md:sticky md:left-[220px] md:z-20 min-w-[250px] ${
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
                          colSpan={14}
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
      ? "cursor-pointer hover:bg-gray-300 w-[200px]"
      : ""
  }

  ${
    header === "Scoring"
      ? "min-w-[300px]"
      : ""
  }

  ${index === 0 ? "md:sticky md:left-0 md:z-40 min-w-[120px]" : ""}
  ${index === 1 ? "md:sticky md:left-[120px] md:z-40 min-w-[100px]" : ""}
  ${index === 2 ? "md:sticky md:left-[220px] md:z-40 min-w-[250px]" : ""}
`}
>
  <div className="flex items-center justify-center gap-1">
    <HeaderTooltip
      title={header}
      description={
        implementationColumnInfo[header] || "Tidak ada keterangan"
      }
    />

    {header === "Status" && (
      <span className="ml-1">
        {sortField === "status"
          ? sortDirection === "asc"
            ? "↑"
            : "↓"
          : "↕"}
      </span>
    )}
  </div>
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
                              className={`p-3 text-center md:sticky md:left-0 md:z-20 min-w-[120px] ${
                                item.status === "NOT STARTED"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.entity}
                            </td>

                            <td
                              className={`p-3 text-center md:sticky md:left-[120px] md:z-20 min-w-[100px] ${
                                item.status === "NOT STARTED"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.id_branch}
                            </td>

                            <td
                              className={`p-3 md:sticky md:left-[220px] md:z-20 min-w-[250px] ${
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

                            <td className="p-3 text-center font-bold min-w-[300px]">
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

                        <td className="p-3 text-center min-w-[300px]">
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
      ? "cursor-pointer hover:bg-gray-300 w-[200px]"
      : ""
  }

  ${
    header === "Scoring"
      ? "min-w-[300px]"
      : ""
  }

  ${index === 0 ? "md:sticky md:left-0 md:z-40 min-w-[120px]" : ""}
  ${index === 1 ? "md:sticky md:left-[120px] md:z-40 min-w-[100px]" : ""}
  ${index === 2 ? "md:sticky md:left-[220px] md:z-40 min-w-[250px]" : ""}
`}
>
  <div className="flex items-center justify-center gap-1">
    <HeaderTooltip
      title={header}
      description={
        intsfaColumnInfo[header] || "Tidak ada keterangan"
      }
    />

    {header === "Status" && (
      <span className="ml-1">
        {sortField === "status"
          ? sortDirection === "asc"
            ? "↑"
            : "↓"
          : "↕"}
      </span>
    )}
  </div>
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
                              className={`p-3 text-center md:sticky md:left-0 md:z-20 min-w-[120px] ${
                                item.status === "NOT READY"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.entity}
                            </td>

                            <td
                              className={`p-3 text-center md:sticky md:left-[120px] md:z-20 min-w-[100px] ${
                                item.status === "NOT READY"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.id_branch}
                            </td>

                            <td
                              className={`p-3 md:sticky md:left-[220px] md:z-20 min-w-[250px] ${
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

                            <td className="p-3 text-center font-bold min-w-[300px]">
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

                        <td className="p-3 text-center min-w-[300px]">
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
                  "Stock Last Date",
                  "Invoice Last Date",
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
        ? "cursor-pointer hover:bg-gray-300 w-[350px]"
        : ""
    }
    ${index === 0 ? "md:sticky md:left-0 md:z-40 min-w-[120px]" : ""}
    ${index === 1 ? "md:sticky md:left-[120px] md:z-40 min-w-[100px]" : ""}
    ${index === 2 ? "md:sticky md:left-[220px] md:z-40 min-w-[250px]" : ""}
  `}
>
  <div className="flex items-center justify-center gap-1">
    <HeaderTooltip
      title={header}
      description={
        intdmsColumnInfo[header] || "Tidak ada keterangan"
      }
    />

    {header === "Status" && (
      <span className="ml-1">
        {sortField === "status"
          ? sortDirection === "asc"
            ? "↑"
            : "↓"
          : "↕"}
      </span>
    )}
  </div>
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
                              className={`p-3 text-center md:sticky md:left-0 md:z-20 min-w-[120px] ${
                                item.status === "NOT READY"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.entity}
                            </td>

                            <td
                              className={`p-3 text-center md:sticky md:left-[120px] md:z-20 min-w-[100px] ${
                                item.status === "NOT READY"
                                  ? "bg-red-50"
                                  : "bg-white"
                              }`}
                            >
                              {item.id_branch}
                            </td>

                            <td
                              className={`p-3 md:sticky md:left-[220px] md:z-20 min-w-[250px] ${
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
                            <td className="p-3 text-center">
                              {item.tgl_terakhir_stok || "-"}
                            </td>

                            <td className="p-3 text-center">
                              {item.tgl_terakhir_invoice || "-"}
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
                          colSpan={11}
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

{tab === "summary" && (
  <>
    <PageHeader
      total={summaryData.length}
      count={filterAndSortData(summaryData).length}
    />

    <TableWrapper>
      <thead className="bg-gray-200 sticky top-0 z-30">
        <tr>
          {[
            "ALL DISTRI",
            "SUDAH ROLLOUT",
            "BELUM ROLLOUT",
            "ROLLOUT KONSISTEN",
            "ROLLOUT BELUM KONSISTEN",
            "SUDAH INTEGRATED",
            "INTEGRATED BELUM KONSISTEN",
          ].map((header) => (
            <th
              key={header}
              className="p-3 border-b font-semibold whitespace-nowrap bg-gray-200 text-center"
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {filterAndSortData(summaryData).map((item: any, index: number) => (
          <tr key={index} className="border-b">
            <td className="p-3 text-center">
              {item.total}
            </td>

            <td className="p-3 text-center">
              {item.sudah_rollout}
            </td>

            <td className="p-3 text-center">
              {item.belum_rollout}
            </td>

            <td className="p-3 text-center">
              {item.rollout_konsisten}
            </td>

            <td className="p-3 text-center">
              {item.rollout_belum_konsisten}
            </td>

            <td className="p-3 text-center">
              {item.sudah_integrated}
            </td>

            <td className="p-3 text-center">
              {item.integrated_belum_konsisten}
            </td>
          </tr>
        ))}
      </tbody>
    </TableWrapper>
  </>
)}

      {/* ================= MODAL ================= */}
{showStatusChart && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
    <div
  className="
  bg-white
  w-[95%]
  md:w-[700px]
  rounded-2xl
  p-4 md:p-6
  "
>
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

      <div className="h-[300px] md:h-[450px]">
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
{showInfo && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">
    <div className="bg-white w-[90%] max-w-lg rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          Status Information
        </h2>

        <button
          onClick={() => setShowInfo(false)}
        >
          <X />
        </button>
      </div>

      <div className="space-y-3">
        {statusInfo[tab].map((item, index) => (
          <div
            key={index}
            className="border-b pb-2"
          >
            <div className="font-semibold">
              {item.status}
            </div>

            <div className="text-sm text-gray-600">
              {item.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
    </div>
  );
}