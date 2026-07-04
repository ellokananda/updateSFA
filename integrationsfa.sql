select ms.kodecabang as entity, ms.kodescabang as id_branch, ms.ket as branch_name,
case 
	when c.start_date is null then 'Template Output Belum Disepakati'
	when f.branch is not null then 'Running'
	else 'Konfigurasi'
end as activity,
case
	when c.start_date is null then 'NOT READY'
	when f.branch is not null then 'DONE'
	else 'PROGRESS'
end status,
isnull (format(c.start_date, 'dd-MMM-yyyy'),'-')as start_date,
case 
	when c.start_date is null then '-'
	else format (dateadd(day, 10, c.start_date),'dd-MMM-yyyy')
end as end_date,

case
	when c.start_date is null then '0%'
	when f.branch is not null then '100%'
	else '50%'
end as scoring

from m_scabang as ms
left join (select branch, max(cast(created_at as DATE)) as start_date from interface_exptrx_configs where block_id like 'Z01%' group by branch) c on ms.kodescabang = c.branch 
left join (select distinct kodecabang as branch from forder_h where FLAG_INPUT = 'Y' AND CONVERT(date, tglorder, 103) = CAST(GETDATE() - 1 AS date)) f on ms.kodescabang = f.branch
where ms.kodecabang <> 'KOKOLA-MNN' and ms.flag_aktif != 'N'
order by ms.kodecabang, ms.kodescabang, c.start_date;