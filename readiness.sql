SELECT 
    ms.kodecabang AS entity,
    ms.kodescabang AS id_branch,
    ms.ket AS branch_name,
    ISNULL(fs.sfa_sales, 0) AS mastersfa_salesman,
    ISNULL(fc.sfa_cust, 0) AS mastersfa_cust,
    prodsfa='91',
    isnull(fr.rute,0) as rute,
    isnull(fsd.dist_sales,0) as masterdist_sls,
    isnull(fcd.dist_cust,0) as masterdist_cust,
    isnull(fpd.dist_prod,0) as masterdist_prod,
    isnull(fsd.dist_sales,0) as map_sales,
    isnull(fmc.map_cust,0) as map_cust,
    isnull(fmp.map_prod,0) as map_prod,
    
    ROUND(
(
    (
        CASE WHEN ISNULL(fs.sfa_sales,0) > 0 THEN 1 ELSE 0 END +
        CASE WHEN ISNULL(fc.sfa_cust,0) > 0 THEN 1 ELSE 0 END +
        1 + -- prodsfa selalu ada ('91')
        CASE WHEN ISNULL(fr.rute,0) > 0 THEN 1 ELSE 0 END +

        CASE WHEN ISNULL(fsd.dist_sales,0) > 0 THEN 1 ELSE 0 END +
        CASE WHEN ISNULL(fcd.dist_cust,0) > 0 THEN 1 ELSE 0 END +
        CASE WHEN ISNULL(fpd.dist_prod,0) > 0 THEN 1 ELSE 0 END +

        CASE WHEN ISNULL(fsd.dist_sales,0) > 0 THEN 1 ELSE 0 END + -- map_sales
        CASE WHEN ISNULL(fmc.map_cust,0) > 0 THEN 1 ELSE 0 END +
        CASE WHEN ISNULL(fmp.map_prod,0) > 0 THEN 1 ELSE 0 END
    ) * 100.0 / 10
),
0
) AS scoring,

    CASE 

    WHEN 
        ISNULL(fs.sfa_sales,0) = 0
        OR ISNULL(fc.sfa_cust,0) = 0
        OR ISNULL(fr.rute,0) = 0
    THEN 'NOT STARTED'

    WHEN 
        (
            ISNULL(fs.sfa_sales,0) > 0
            AND ISNULL(fc.sfa_cust,0) > 0
            AND ISNULL(fr.rute,0) > 0
        )
        AND
        (
            ISNULL(fsd.dist_sales,0) = 0
            OR ISNULL(fcd.dist_cust,0) = 0
            OR ISNULL(fpd.dist_prod,0) = 0
            OR ISNULL(fmc.map_cust,0) = 0
            OR ISNULL(fmp.map_prod,0) = 0
        )
    THEN 'READY FOR IMPLEMENTATION'

    WHEN 
        ISNULL(fs.sfa_sales,0) > 0
        AND ISNULL(fc.sfa_cust,0) > 0
        AND ISNULL(fr.rute,0) > 0
        AND ISNULL(fsd.dist_sales,0) > 0
        AND ISNULL(fcd.dist_cust,0) > 0
        AND ISNULL(fpd.dist_prod,0) > 0
        AND ISNULL(fmc.map_cust,0) > 0
        AND ISNULL(fmp.map_prod,0) > 0
    THEN 'READY FOR INTEGRATION'

    ELSE 'UNKNOWN'

END AS status,
case when gl.golive = 'Y' then 'Y' else 'N' end as rollout,
case when gl.golive = 'Y' then 'Y' else 'N' end as golive
FROM m_scabang ms
left join (SELECT kodecabang, COUNT(DISTINCT slsno) AS sfa_sales FROM fsalesman WHERE caraopr <> 'SUPERVISOR' and team <> 'SPV01' GROUP BY kodecabang) fs ON ms.kodescabang = fs.kodecabang
left join (SELECT kodecabang, COUNT(DISTINCT custno) AS sfa_cust FROM fcustmst where custno not in ('153401','153402','153403','369101','369102','369103','384401','384402','384403','1552101','1552102','1552103',
'1810000','1810000D','1810000DF')
GROUP BY kodecabang) fc ON ms.kodescabang = fc.kodecabang
left join (select bid, count(distinct muid) as dist_sales from fmap_salesman_dist fsd group by bid) fsd on ms.kodescabang = fsd.bid
left join (select distid, count (distinct custno) as dist_cust from fcustmst_dist group by distid) fcd on ms.kodescabang = fcd.distid
left join (select distid, count (distinct pcode) as dist_prod from fmaster_dist group by distid) fpd on ms.kodescabang = fpd.distid
left join (select distid, count (distinct custno_dist)as map_cust from fcustmst_dist_map group by distid) fmc on ms.kodescabang = fmc.distid
left join (select kodecabang, count (custno) as rute from frute where custno not in ('153401','153402','153403','369101','369102','369103','384401','384402','384403','1552101','1552102','1552103',
'1810000','1810000D','1810000DF') group by kodecabang) fr on ms.kodescabang = fr.kodecabang
left join (select distid, count (distinct pcode) as map_prod from fmaster_dist where pcode_prc is not null AND LTRIM(RTRIM(pcode_prc)) <> '' group by distid) fmp on ms.kodescabang = fmp.distid
left join (
    select distinct
        fd.kodecabang,
        'Y' as golive
    from forder_d1 fd
    inner join forder_h fh
        on fh.slsno = fd.slsno
        and fh.custno = fd.custno
        and fh.orderno = fd.orderno
        and fh.tglorder = fd.tglorder
    where fh.dk3_no is not null
) gl
    on ms.kodescabang = gl.kodecabang
where ms.kodecabang <> 'KOKOLA-MNN' and ms.kodescabang <> '220' and ms.flag_aktif != 'N' 
order by 
    ms.kodecabang,
    ms.kodescabang;