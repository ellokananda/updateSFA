SELECT 
    ms.kodecabang AS entity,
    ms.kodescabang AS id_branch,
    ms.ket AS branch_name,
CASE
    WHEN d.first_trans IS NULL
        THEN '-'
    ELSE FORMAT(
        DATEADD(DAY, -7, d.first_trans),
        'dd-MMM-yyyy'
    )
END AS rollout,

CASE
    WHEN d.first_trans IS NULL
        THEN '-'
    ELSE FORMAT(
        DATEADD(DAY, 15, d.first_trans),
        'dd-MMM-yyyy'
    )
END AS golive,
    CASE
	    WHEN ISNULL(d2.total_trans,0) > 0
	        THEN 'Y'
	    ELSE 'N'
	END AS input_transaksi,
	ISNULL(
    FORMAT(d.first_trans,'dd-MMM-yyyy'),
    '-'
) AS first_trans,
	isnull (d2.total_trans,0) as total_trans,
	ISNULL(fs.sfa_sales, 0) AS useraktif,
	isnull (d3.sls,0) as salesman_aktif,
	CASE 
    WHEN ISNULL(fs.sfa_sales,0) = 0 
        THEN 0
    ELSE ROUND(
        (ISNULL(d3.sls,0) * 100.0) 
        / ISNULL(fs.sfa_sales,0),
        0
    )
END AS persen_sales,
CASE
    WHEN 
        d.first_trans IS NOT NULL
        AND ISNULL(d2.total_trans,0) > 10
        AND ISNULL(fs.sfa_sales,0) > 0
        AND ISNULL(d3.sls,0) > 0
    THEN 'GO LIVE'

    WHEN 
        d.first_trans IS NOT NULL
    THEN 'TRAINING'

    ELSE 'NOT STARTED'
END AS status,
(
    CASE 
        WHEN ISNULL(d2.total_trans,0) > 0 
            THEN 40 
        ELSE 0 
    END

    +

    CASE 
        WHEN ISNULL(d2.total_trans,0) > 15 
            THEN 20 
        ELSE 0 
    END

    +

    CASE 
        WHEN 
            (
                CASE 
                    WHEN ISNULL(fs.sfa_sales,0) = 0 
                        THEN 0
                    ELSE ROUND(
                        (ISNULL(d3.sls,0) * 100.0) 
                        / ISNULL(fs.sfa_sales,0),
                        0
                    )
                END
            ) > 0
            THEN 30
        ELSE 0
    END

    +

    CASE
        WHEN 
            d.first_trans IS NOT NULL
            AND ISNULL(d2.total_trans,0) > 10
            AND ISNULL(fs.sfa_sales,0) > 0
            AND ISNULL(d3.sls,0) > 0
        THEN 10
        ELSE 0
    END
) AS scoring


FROM m_scabang ms
LEFT JOIN (SELECT kodecabang,MIN(TRY_CONVERT(DATE, tglorder, 103)) AS first_trans FROM forder_d1 GROUP BY kodecabang) d ON ms.kodescabang = d.kodecabang
LEFT JOIN (
    SELECT 
        fd.kodecabang,
        COUNT(fd.orderno) AS total_trans
    FROM forder_d1 fd

    LEFT JOIN forder_h fh 
        ON fh.slsno = fd.slsno
        AND fh.custno = fd.custno
        AND fh.orderno = fd.orderno
        AND fh.tglorder = fd.tglorder

    WHERE ISNULL(fh.flag_noo,'N') != 'Y'

    GROUP BY fd.kodecabang
) d2 
ON ms.kodescabang = d2.kodecabang
left join (SELECT kodecabang, COUNT(DISTINCT slsno) AS sfa_sales FROM fsalesman WHERE caraopr <> 'SUPERVISOR' and team <> 'SPV01' GROUP BY kodecabang) fs ON ms.kodescabang = fs.kodecabang
left join (select kodecabang, count (distinct slsno)as sls from forder_d1 group by kodecabang)d3 on ms.kodescabang = d3.kodecabang
where ms.kodecabang <> 'KOKOLA-MNN' and ms.kodescabang <> '220' and ms.flag_aktif != 'N' 
order by 
    ms.kodecabang,
    ms.kodescabang;