WITH STOCK AS
(
    -- Stock yang sudah menggunakan Product ID Kokola
    SELECT
        fs.kodecabang,
        fs.pcode,
        fs.stock,
        fs.updatedate
    FROM fstockbarang fs
    UNION ALL
    -- Stock yang menggunakan Product ID Distributor,
    -- hanya jika produk tersebut BELUM ada di fstockbarang
    SELECT
        fd.kodecabang_dist AS kodecabang,
        md.pcode_prc       AS pcode,
        fd.stock_dist      AS stock,
        fd.updatedate
    FROM fstockbarang_dist fd
    INNER JOIN fmaster_dist md
        ON md.kodecabang = fd.kodecabang_dist
       AND md.pcode      = fd.pcode_dist
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM fstockbarang fs
        WHERE fs.kodecabang = fd.kodecabang_dist
          AND fs.pcode      = md.pcode_prc
    )
)
SELECT
    s.kodecabang,
    fm.pcode AS product_code,
    fm.pcodename AS product_name,
    -- Stock asli dalam PCS
    -- UOM 1
    CONCAT(
        CASE
            WHEN ISNULL(fm.unit3,'') <> '' THEN
                FLOOR(s.stock / (fm.convunit5 * fm.convunit4))
            ELSE
                FLOOR(s.stock / fm.convunit5)
        END,
        ' ',
        fm.unit1
    ) AS stock_uom1,
    -- UOM 2
    CONCAT(
        CASE
            WHEN ISNULL(fm.unit3,'') <> '' THEN
                FLOOR(
                    (s.stock % (fm.convunit5 * fm.convunit4))
                    / fm.convunit4
                )
            ELSE
                s.stock % fm.convunit5
        END,
        ' ',
        fm.unit2
    ) AS stock_uom2,
    -- UOM 3
    CASE
        WHEN ISNULL(fm.unit3,'') <> '' THEN
            CONCAT(
                s.stock % fm.convunit4,
                ' ',
                fm.unit3
            )
        ELSE
            '-'
    END AS stock_uom3,
        s.stock AS pcs,
    s.updatedate
FROM STOCK s
INNER JOIN fmaster fm
    ON fm.pcode = s.pcode
ORDER BY
    s.kodecabang,
    fm.pcode;