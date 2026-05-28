SELECT 
    ms.kodecabang AS entity,
    ms.kodescabang AS id_branch,
    ms.ket AS branch_name,
    CASE
    WHEN c.start_date IS NULL
        THEN 'Template Output Telah Disepakati'
    ELSE 'Validasi DMS'
	END AS activity,
	CASE
	    WHEN c.start_date IS NULL
	        THEN 'NOT READY'
	    ELSE 'DONE'
	END AS status,
ISNULL(
    FORMAT(c.start_date, 'dd-MMMM-yyyy'),
    '-'
) AS start_date,
    CASE
    WHEN c.start_date IS NULL
        THEN '-'
    ELSE FORMAT(DATEADD(DAY, 10, c.start_date), 'dd-MMM-yyyy')
	END AS end_date,
	CASE
    WHEN c.start_date IS NULL
        THEN '0%'
    ELSE '100%'
	END AS scoring
FROM m_scabang ms
LEFT JOIN (SELECT branch,CAST(created_at AS DATE) AS start_date FROM interface_exptrx_configs) c ON ms.kodescabang = c.branch
where ms.kodecabang <> 'KOKOLA-MNN' and ms.kodescabang <> '220' and ms.flag_aktif != 'N' 
order by ms.kodecabang,ms.kodescabang,c.start_date;