select ms.koderegion, 'MNN' as regionname,ms.kodecabang as entitycode, 
case 
        WHEN ms.kodecabang = 'BALNUS' THEN 'Bali nusra'
        WHEN ms.kodecabang = 'DKI' THEN 'Jabodetabek'
        WHEN ms.kodecabang = 'JBR01' THEN 'Jawa barat barat'
        WHEN ms.kodecabang = 'JBR02' THEN 'Jawa Barat'
        WHEN ms.kodecabang = 'JTE01' THEN 'Jawa Tengah Utara'
        WHEN ms.kodecabang = 'JTE02' THEN 'Jawa Tengah Selatan'
        WHEN ms.kodecabang = 'JTM01' THEN 'Jawa Timur Utara'
        WHEN ms.kodecabang = 'JTM02' THEN 'Jawa Timur Selatan'
        WHEN ms.kodecabang = 'KLM' THEN 'Kalimantan'
		WHEN ms.kodecabang = 'SLW' THEN 'Sulawesi'
        WHEN ms.kodecabang = 'SMT01' THEN 'Sumbagut'
        WHEN ms.kodecabang = 'SMT02' THEN 'Sumbagsel'
        ELSE '-'
    END AS entityname,
ms.kodescabang as branchcode, ms.ket as branchname, fh.slsno, fs.slsname,fh.custno, fc.custname,fh.orderno, fh.dk3_no as refno, CONVERT ( DATE, fh.TGLORDER, 103) as tglorder,
fh.timein as ordtime, ln.prlin, ln.prliname, fd.pcode, fm.PCODENAME as pname, fd.qty,
CASE 
    WHEN fd.SELLPRICE3 <> 0 THEN fd.SELLPRICE3
    WHEN fd.SELLPRICE4 <> 0 THEN fd.SELLPRICE4
    ELSE fd.SELLPRICE5
END AS sellprice,fd.amount as gross, fd.QTYB as unit1, fd.qtyt as unit2, fd.qtyk as unit3, fd.qty4 as unit4, fd.qty5 as unit5, ISNULL(d.sfa_disc_dist_amt, 0) + ISNULL(d.sfa_disc_principal_amt, 0) AS discval,
ISNULL(d.sfa_disc_dist_PCt, 0) + ISNULL(d.sfa_disc_principal_PCt, 0) AS discpct, d.sfa_disc_id as discid
from forder_h fh 
left join m_scabang as ms on fh.kodecabang = ms.kodescabang
left join fsalesman as fs on fh.slsno = fs.slsno and fh.kodecabang = fs.kodecabang
left join fcustmst as fc on fh.custno = fc.custno and fh.kodecabang = fc.kodecabang
left join forder_d1 as fd on fh.orderno = fd.orderno and fh.TGLORDER = fd.TGLORDER and fh.KODECABANG = fd.KODECABANG 
left join fmaster as fm on fd.pcode = fm.pcode 
left join fprlin as ln on fm.prlin = ln.prlin 
LEFT JOIN sfa_forder_disc_d AS d WITH (nolock) ON
	fd.ORDERNO = d.sfa_doc_no
	AND fd.PCODE = d.sfa_disc_pcode
	AND fd.SLSNO = d.sfa_disc_slsno
	AND CONVERT(DATE, fd.TGLORDER, 103) = d.sfa_transdate
	AND d.sfa_disc_region != ''
WHERE TRY_CONVERT(DATE, fh.TGLORDER, 103)
      >= DATEADD(DAY, -31, CAST(GETDATE() AS DATE)) 
      and fh.DK3_NO in ('19126060000000000081','19126060000000000072','19126060000000000250')
ORDER BY
    ms.ket ASC,
    TRY_CONVERT(DATE, fh.TGLORDER, 103) ASC;