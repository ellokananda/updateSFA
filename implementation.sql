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
	isnull(format(d.first_trans,'dd-mm-yyyy'),'-') as first_trans,
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
left join (select kodecabang,min(try_convert(date, tglorder, 103)) as first_trans from forder_d1 group by kodecabang) d on ms.kodescabang = d.kodecabang
left join (select fd.kodecabang, COUNT(fd.orderno) AS total_trans FROM forder_d1 fd
	left join forder_h fh on fh.slsno = fd.slsno and fh.custno = fd.custno and fh.orderno = fd.orderno and fh.tglorder = fd.tglorder where isnull (fh.flag_noo,'N') != 'Y' group by fd.kodecabang) d2 
	 on ms.kodescabang = d2.kodecabang
left join (select kodecabang, count(distinct slsno) as sfa_sales from fsalesman where caraopr <> 'SUPERVISOR' and team <> 'SPV01' group by kodecabang) fs on ms.kodescabang = fs.kodecabang
left join (select kodecabang, count(distinct slsno) as sls from forder_d1 where month (try_convert(date, tglorder, 103)) = month(GETDATE()) and year(try_convert(date, tglorder, 103)) = year(GETDATE())
    group by kodecabang) d3 
on ms.kodescabang = d3.kodecabang
where ms.kodecabang <> 'KOKOLA-MNN' and ms.kodescabang <> '220' and ms.flag_aktif != 'N' and MS.KODECABANG <> 'JBR01'
and not (
    ms.ket = 'Selaras Bersama'
    and ms.kodecabang <> 'JBR02'
)
order by ms.kodecabang, ms.kodescabang;