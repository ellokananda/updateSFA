select m.kodecabang as entity, m.kodescabang as id_branch, m.ket as branch_name,
case when exists ( --select 1 digunakan untuk cek apakah ada data / tidak
	select 1 from interface_exptrx_configs t where t.branch = m.kodescabang) then 1 else 0 end as configto,

case when exists (
	select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and (ms.block_id like '%imstk%' or ms.block_id like '%imstok%')) then 1 else 0 end as configstk,

case when exists (
	select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and ms.block_id like '%slsinv%') then 1 else 0 end as configinv,

case when exists (
	select 1 from fstockbarang fs where fs.kodecabang = m.kodescabang and cast (fs.updatedate as date)>= dateadd(day,-7,cast(getdate()as date))) then 1 else 0 end as datastk,

case when exists (
	select 1 from sap_web_inv_sfa inv where inv.kodecabang = m.kodescabang and cast(inv.invoice_date as date) >= dateadd(day,-7,cast(getdate() as date))) then 1 else 0 end as datainv,

--(select max(fs.updatedate)from fstockbarang fs where fs.kodecabang = m.kodescabang) as tgl_terakhir_stok,
--(select max(inv.invoice_date)from sap_web_inv_sfa inv where inv.kodecabang = m.kodescabang) as tgl_terakhir_invoice,
	
-- 100 ketika config interface, stok, sales invoice, fstokbarang, sap web inv ada isinya
case when exists (select 1 from interface_exptrx_configs t where t.branch = m.kodescabang) --config taking order
	and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and (ms.block_id like '%imstk%' or ms.block_id like '%imstok%')) --config stok
	and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and ms.block_id like '%slsinv%') --config sales invoice
	and exists (select 1 from fstockbarang fs where fs.kodecabang = m.kodescabang) --data stok
	and exists (select 1 from sap_web_inv_sfa inv where inv.kodecabang = m.kodescabang and cast(inv.invoice_date as date) >= dateadd(day,-7,cast(getdate() as date))) --data sales invoice
then 100

-- 75 ketika config interface,stok,sales invoice ada, dan salah satu dari fstok/sap web ada data
when exists (select 1 from interface_exptrx_configs t where t.branch = m.kodescabang) --config taking order
and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and (ms.block_id like '%imstk%' or ms.block_id like '%imstok%')) --config stok
and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and ms.block_id like '%slsinv%') --config sales invoice
and (exists (select 1 from fstockbarang fs where fs.kodecabang = m.kodescabang) --cek salah 1 data antara stok/salesinv jika salah 1 sudah ada datanya
	or exists (select 1 from sap_web_inv_sfa inv where inv.kodecabang = m.kodescabang and cast(inv.invoice_date as date) >= dateadd(day,-7,cast(getdate() as date))))
then 75

-- 50 ketika config taking order, slsinv,dan stok yang ada , data belum ada
when exists (select 1 from interface_exptrx_configs t where t.branch = m.kodescabang) --config taking order
and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and (ms.block_id like '%imstk%' or ms.block_id like '%imstok%')) --config stok
and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and ms.block_id like '%slsinv%') --config slsinv
and not exists (select 1 from fstockbarang fs where fs.kodecabang = m.kodescabang) --data stok blm ada
and not exists (select 1 from sap_web_inv_sfa inv where inv.kodecabang = m.kodescabang and cast(inv.invoice_date as date) >= dateadd(day,-7,cast(getdate() as date))) --data slsinv blm ada
then 50
else 0 end as scoring,

-- DONE ketika config interface, stok, sales invoice, fstokbarang, sap web inv ada isinya
case when exists (select 1 from interface_exptrx_configs t where t.branch = m.kodescabang) --config taking order
	and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and (ms.block_id like '%imstk%' or ms.block_id like '%imstok%')) --config stok
	and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and ms.block_id like '%slsinv%') --config sales invoice
	and exists (select 1 from fstockbarang fs where fs.kodecabang = m.kodescabang) --data stok
	and exists (select 1 from sap_web_inv_sfa inv where inv.kodecabang = m.kodescabang and cast(inv.invoice_date as date) >= dateadd(day,-7,cast(getdate() as date))) --data sales invoice
then 'DONE'

-- PROGRESS ketika config interface,stok,sales invoice ada, dan salah satu dari fstok/sap web ada data
when exists (select 1 from interface_exptrx_configs t where t.branch = m.kodescabang) --config taking order
and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and (ms.block_id like '%imstk%' or ms.block_id like '%imstok%')) --config stok
and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and ms.block_id like '%slsinv%') --config sales invoice
and (exists (select 1 from fstockbarang fs where fs.kodecabang = m.kodescabang) --cek salah 1 data antara stok/salesinv jika salah 1 sudah ada datanya
	or exists (select 1 from sap_web_inv_sfa inv where inv.kodecabang = m.kodescabang and cast(inv.invoice_date as date) >= dateadd(day,-7,cast(getdate() as date))))
then 'PROGRESS'

-- READY ketika config taking order, slsinv,dan stok yang ada , data belum ada
when exists (select 1 from interface_exptrx_configs t where t.branch = m.kodescabang) --config taking order
and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and (ms.block_id like '%imstk%' or ms.block_id like '%imstok%')) --config stok
and exists (select 1 from interface_mstdt_configs ms where ms.branch = m.kodescabang and ms.block_id like '%slsinv%') --config slsinv
and not exists (select 1 from fstockbarang fs where fs.kodecabang = m.kodescabang) --data stok blm ada
and not exists (select 1 from sap_web_inv_sfa inv where inv.kodecabang = m.kodescabang and cast(inv.invoice_date as date) >= dateadd(day,-7,cast(getdate() as date))) --data slsinv blm ada
then 'READY'
else 'NOT READY' end as status

from m_scabang m
where m.kodecabang <> 'KOKOLA-MNN' and m.kodescabang <> '220' and m.flag_aktif != 'N'
order by m.kodecabang;