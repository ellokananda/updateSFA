DECLARE @TanggalAcuan DATE =
CASE
    WHEN DATENAME(WEEKDAY, GETDATE()) = 'Monday'
        THEN DATEADD(DAY,-2,CAST(GETDATE() AS DATE))
    ELSE DATEADD(DAY,-1,CAST(GETDATE() AS DATE))
END;
SELECT
    COUNT(*) AS total,

    COUNT(CASE WHEN a.input_transaksi = 'Y' THEN 1 END) AS sudah_rollout,

    COUNT(*) - COUNT(CASE WHEN a.input_transaksi = 'Y' THEN 1 END) AS belum_rollout,

    COUNT(CASE WHEN a.cek = 'Y' THEN 1 END) AS rollout_konsisten, --Jika transaksi terakhir dilakukan pada H-1 sampai hari ini, maka distributor dianggap masih aktif melakukan transaksi sehingga rollout-nya konsisten.

    COUNT(CASE WHEN a.input_transaksi = 'Y' THEN 1 END)
        - COUNT(CASE WHEN a.cek = 'Y' THEN 1 END) AS rollout_belum_konsisten, --distributor sudah rollout namun tidak rutin melakukan transaksi

    COUNT(CASE WHEN a.activity = '1' THEN 1 END) AS sudah_integrated,

    COUNT(*) - COUNT(CASE WHEN a.activity = '1' THEN 1 END) AS integrated_belum_konsisten

--    COUNT(CASE WHEN a.integrated = '1' THEN 1 END) AS integrated,
--
--    COUNT(*) - COUNT(CASE WHEN a.integrated = '1' THEN 1 END) AS belum_integrated

FROM
(
    SELECT
        ms.kodecabang AS entity,
        ms.kodescabang AS id_branch,
        ms.ket AS branch_name,

        CASE
            WHEN ISNULL(d2.total_trans,0) > 0 THEN 'Y'
            ELSE 'N'
        END AS input_transaksi,

        d.last_trans,

CASE
    WHEN d.last_trans BETWEEN @TanggalAcuan AND CAST(GETDATE() AS DATE)
    THEN 'Y'
    ELSE 'N'
END AS cek,

        CASE
    WHEN f.branch IS NOT NULL
     AND s.branch IS NOT NULL
     AND i.branch IS NOT NULL
    THEN '1'
    ELSE '0'
END AS activity

--        CASE
--            WHEN EXISTS (
--                    SELECT 1
--                    FROM interface_exptrx_configs t
--                    WHERE t.branch = ms.kodescabang
--                )
--             AND EXISTS (
--                    SELECT 1
--                    FROM interface_mstdt_configs mc
--                    WHERE mc.branch = ms.kodescabang
--                      AND (
--                            mc.block_id LIKE '%imstk%'
--                         OR mc.block_id LIKE '%imstok%'
--                         OR mc.block_id LIKE '%MKASTCKBRG%'
--                      )
--                )
--             AND EXISTS (
--                    SELECT 1
--                    FROM interface_mstdt_configs mc
--                    WHERE mc.branch = ms.kodescabang
--                      AND mc.block_id LIKE '%slsinv%'
--                )
--            THEN '1'
--            ELSE '0'
--        END AS integrated

    FROM m_scabang ms

    LEFT JOIN
    (
        SELECT
            kodecabang,
            MIN(TRY_CONVERT(date,tglorder,103)) AS first_trans,
            MAX(TRY_CONVERT(date,tglorder,103)) AS last_trans
        FROM forder_d1
        GROUP BY kodecabang
    ) d
        ON ms.kodescabang = d.kodecabang

    LEFT JOIN
    (
        SELECT
            fd.kodecabang,
            COUNT(fd.orderno) AS total_trans
        FROM forder_d1 fd
        LEFT JOIN forder_h fh
            ON fh.slsno = fd.slsno
           AND fh.custno = fd.custno
           AND fh.orderno = fd.orderno
           AND fh.tglorder = fd.tglorder
        WHERE ISNULL(fh.flag_noo,'N') <> 'Y'
        GROUP BY fd.kodecabang
    ) d2
        ON ms.kodescabang = d2.kodecabang
LEFT JOIN
(
    SELECT DISTINCT kodecabang AS branch
    FROM forder_h
    WHERE flag_input = 'Y'
      AND CONVERT(date, tglorder, 103) = @TanggalAcuan
) f
    ON ms.kodescabang = f.branch
LEFT JOIN
(
    SELECT DISTINCT branch
    FROM
    (
        SELECT kodecabang as branch
        FROM fstockbarang
        WHERE CONVERT(date, updatedate) = @TanggalAcuan

        UNION

        SELECT kodecabang_dist as branch
        FROM fstockbarang_dist
        WHERE CONVERT(date, updatedate) = @TanggalAcuan
    ) x
) s
    ON ms.kodescabang = s.branch
    
LEFT JOIN
(
    SELECT DISTINCT kodecabang AS branch
    FROM sap_web_inv_sfa
    WHERE CONVERT(date, invoice_date)
          >= DATEADD(DAY,-10,CAST(GETDATE() AS DATE))
) i
    ON ms.kodescabang = i.branch
    
    

    WHERE ms.kodecabang <> 'KOKOLA-MNN'
      AND ms.kodescabang <> '220'
      AND ms.flag_aktif <> 'N'
      AND ms.kodecabang <> 'JBR01'
      AND NOT (
            ms.ket = 'Selaras Bersama'
        AND ms.kodecabang <> 'JBR02'
      )

) a;

-- rollout itu dihitung dari apakah sudah ad atransaksi
-- belum rollout itu distri yg blm ada transaksi
-- rollout konsisten dihitung dr distri yg masih ada transaksi di h-1
-- rollout tdk konsisten dihitung dari distri yg tdk konsisten input h-1
--Sudah Rollout (input_transaksi = 'Y')	Seluruh histori transaksi (tidak dibatasi tanggal)
--Belum Rollout	Seluruh histori (belum pernah ada transaksi sama sekali)
--Rollout Konsisten (cek='Y')	H-1 (atau H-2 jika hari Senin) sampai hari ini
--Rollout Belum Konsisten	Berdasarkan rollout tetapi tidak ada transaksi di H-1/H-2
--Sudah Integrated (activity='1')	Order H-1/H-2, Stock H-1/H-2, Invoice 10 hari terakhir
--Integrated Belum Konsisten	Tidak memenuhi syarat integrated di atas
