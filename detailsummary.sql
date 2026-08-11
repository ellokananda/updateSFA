DECLARE @TanggalAcuan DATE =
CASE
    WHEN DATENAME(WEEKDAY, GETDATE()) = 'Monday'
        THEN DATEADD(DAY,-2,CAST(GETDATE() AS DATE))
    ELSE DATEADD(DAY,-1,CAST(GETDATE() AS DATE))
END;

SELECT
    ms.kodecabang AS entity,
    ms.kodescabang AS id_branch,
    ms.ket AS branch_name,

    CASE
        WHEN f.branch IS NOT NULL THEN 'Y'
        ELSE 'N'
    END AS taking_order,

    f_last.last_taking_order,

    CASE
        WHEN i.branch IS NOT NULL THEN 'Y'
        ELSE 'N'
    END AS invoice,

    i_last.last_invoice,

    CASE
        WHEN s.branch IS NOT NULL THEN 'Y'
        ELSE 'N'
    END AS stock,

    s_last.last_stock
FROM m_scabang ms
-- Taking Order (Status)
LEFT JOIN
(
    SELECT DISTINCT
        kodecabang AS branch
    FROM forder_h
    WHERE flag_input = 'Y'
      AND CONVERT(date, tglorder, 103) = @TanggalAcuan
) f
ON ms.kodescabang = f.branch
-- Taking Order (Tanggal Terakhir)
LEFT JOIN
(
    SELECT
        kodecabang AS branch,
        MAX(CONVERT(date, tglorder, 103)) AS last_taking_order
    FROM forder_h
    GROUP BY kodecabang
) f_last
ON ms.kodescabang = f_last.branch
-- Stock (Status)
LEFT JOIN
(
    SELECT DISTINCT branch
    FROM
    (
        SELECT kodecabang AS branch
        FROM fstockbarang
        WHERE CONVERT(date, updatedate) = @TanggalAcuan

        UNION

        SELECT kodecabang_dist AS branch
        FROM fstockbarang_dist
        WHERE CONVERT(date, updatedate) = @TanggalAcuan
    ) x
) s
ON ms.kodescabang = s.branch
-- Stock (Tanggal Terakhir)
LEFT JOIN
(
    SELECT
        branch,
        MAX(updatedate) AS last_stock
    FROM
    (
        SELECT
            kodecabang AS branch,
            updatedate
        FROM fstockbarang

        UNION ALL

        SELECT
            kodecabang_dist AS branch,
            updatedate
        FROM fstockbarang_dist
    ) x
    GROUP BY branch
) s_last
ON ms.kodescabang = s_last.branch
-- Invoice (Status)
LEFT JOIN
(
    SELECT DISTINCT
        kodecabang AS branch
    FROM sap_web_inv_sfa
    WHERE CONVERT(date, invoice_date) >= DATEADD(DAY,-10,CAST(GETDATE() AS DATE))
) i
ON ms.kodescabang = i.branch
-- Invoice (Tanggal Terakhir)
LEFT JOIN
(
    SELECT
        kodecabang AS branch,
        MAX(CONVERT(date, invoice_date)) AS last_invoice
    FROM sap_web_inv_sfa
    GROUP BY kodecabang
) i_last
ON ms.kodescabang = i_last.branch
WHERE ms.kodecabang <> 'KOKOLA-MNN'
  AND ms.kodescabang <> '220'
  AND ms.flag_aktif <> 'N'
  AND ms.kodecabang <> 'JBR01'
  AND NOT (
        ms.ket = 'Selaras Bersama'
    AND ms.kodecabang <> 'JBR02'
)
ORDER BY
    ms.kodecabang,
    ms.ket;