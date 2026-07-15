-- ============================================================
-- CyberControl DB Patch Script
-- Barcha yetishmayotgan ustunlar va jadvallarni qoshadi
-- ============================================================

-- Stored procedure yordamida xavfsiz ustun qoshish
DROP PROCEDURE IF EXISTS safe_add_column;

DELIMITER //
CREATE PROCEDURE safe_add_column(
    IN p_table VARCHAR(100),
    IN p_column VARCHAR(100),
    IN p_def TEXT
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table
          AND COLUMN_NAME  = p_column
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_def);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- mahalla: yangi ustunlar
CALL safe_add_column('mahalla', 'is_tuman',   'TINYINT(1) NOT NULL DEFAULT 0');
CALL safe_add_column('mahalla', 'is_viloyat', 'TINYINT(1) NOT NULL DEFAULT 0');

-- hisobot: GPS
CALL safe_add_column('hisobot', 'latitude',              'DOUBLE NULL DEFAULT NULL');
CALL safe_add_column('hisobot', 'longitude',             'DOUBLE NULL DEFAULT NULL');

-- hisobot: statistika ustunlari
CALL safe_add_column('hisobot', 'offline_18_gacha',     'INT NOT NULL DEFAULT 0');
CALL safe_add_column('hisobot', 'offline_18_katta',     'INT NOT NULL DEFAULT 0');
CALL safe_add_column('hisobot', 'online_18_gacha',      'INT NOT NULL DEFAULT 0');
CALL safe_add_column('hisobot', 'online_18_katta',      'INT NOT NULL DEFAULT 0');
CALL safe_add_column('hisobot', 'proof_url',            'VARCHAR(500) NULL DEFAULT NULL');
CALL safe_add_column('hisobot', 'video_kontent_soni',   'INT NOT NULL DEFAULT 0');
CALL safe_add_column('hisobot', 'banner_soni',          'INT NOT NULL DEFAULT 0');
CALL safe_add_column('hisobot', 'flayer_soni',          'INT NOT NULL DEFAULT 0');
CALL safe_add_column('hisobot', 'buklet_soni',          'INT NOT NULL DEFAULT 0');
CALL safe_add_column('hisobot', 'boshqa_material_soni', 'INT NOT NULL DEFAULT 0');
CALL safe_add_column('hisobot', 'suhbat_soni',          'INT NOT NULL DEFAULT 0');
CALL safe_add_column('hisobot', 'hamkor_xodim_id',      'INT NULL DEFAULT NULL');

-- rasm: yangi ustunlar
CALL safe_add_column('rasm', 'file_unique_id', 'VARCHAR(128) NULL DEFAULT NULL');
CALL safe_add_column('rasm', 'phash',          'VARCHAR(64) NULL DEFAULT NULL');

-- rasm: indekslar
SET @idx1 = (SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
             WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='rasm' AND INDEX_NAME='idx_rasm_file_unique_id');
SET @s1 = IF(@idx1=0, 'ALTER TABLE rasm ADD INDEX idx_rasm_file_unique_id (file_unique_id)', 'SELECT 1');
PREPARE st FROM @s1; EXECUTE st; DEALLOCATE PREPARE st;

SET @idx2 = (SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
             WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='rasm' AND INDEX_NAME='idx_rasm_phash');
SET @s2 = IF(@idx2=0, 'ALTER TABLE rasm ADD INDEX idx_rasm_phash (phash)', 'SELECT 1');
PREPARE st FROM @s2; EXECUTE st; DEALLOCATE PREPARE st;

-- hamkor_tashkilot jadvali
CREATE TABLE IF NOT EXISTS hamkor_tashkilot (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nomi        VARCHAR(255) NOT NULL,
    turi        VARCHAR(100) NOT NULL DEFAULT '',
    manzil      VARCHAR(300) NOT NULL DEFAULT '',
    is_active   TINYINT(1)  NOT NULL DEFAULT 1,
    yaratilgan  DATETIME    NOT NULL DEFAULT NOW(),
    viloyat_id  INT         NOT NULL,
    mahalla_id  INT         NULL,
    tuman_id    INT         NULL,
    FOREIGN KEY (viloyat_id)  REFERENCES viloyat(id)  ON DELETE CASCADE,
    FOREIGN KEY (mahalla_id)  REFERENCES mahalla(id)  ON DELETE SET NULL,
    FOREIGN KEY (tuman_id)    REFERENCES tuman(id)    ON DELETE SET NULL
);

-- hamkor_xodim jadvali
CREATE TABLE IF NOT EXISTS hamkor_xodim (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    fio          VARCHAR(255) NOT NULL,
    lavozim      VARCHAR(255) NOT NULL DEFAULT '',
    tel          VARCHAR(50)  NOT NULL DEFAULT '',
    tg_id        BIGINT       NOT NULL DEFAULT 0,
    is_active    TINYINT(1)   NOT NULL DEFAULT 1,
    yaratilgan   DATETIME     NOT NULL DEFAULT NOW(),
    tashkilot_id INT          NOT NULL,
    FOREIGN KEY (tashkilot_id) REFERENCES hamkor_tashkilot(id) ON DELETE CASCADE
);

-- viloyat_infratuzilma jadvali
CREATE TABLE IF NOT EXISTS viloyat_infratuzilma (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    viloyat_id       INT NOT NULL UNIQUE,
    qizil_mfy        INT NOT NULL DEFAULT 0,
    oliy_talim       INT NOT NULL DEFAULT 0,
    akademik_litsey  INT NOT NULL DEFAULT 0,
    orta_talim       INT NOT NULL DEFAULT 0,
    maktabgacha      INT NOT NULL DEFAULT 0,
    kasalxona        INT NOT NULL DEFAULT 0,
    bozor            INT NOT NULL DEFAULT 0,
    xmko             INT NOT NULL DEFAULT 0,
    telegram         INT NOT NULL DEFAULT 0,
    istirohat        INT NOT NULL DEFAULT 0,
    jamoat_transport INT NOT NULL DEFAULT 0,
    masjid           INT NOT NULL DEFAULT 0,
    yangilangan      DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    FOREIGN KEY (viloyat_id) REFERENCES viloyat(id) ON DELETE CASCADE
);

-- kunlik_ishlar jadvali
CREATE TABLE IF NOT EXISTS kunlik_ishlar (
    id                      INT AUTO_INCREMENT PRIMARY KEY,
    viloyat_id              INT          NOT NULL,
    sana                    DATE         NOT NULL,
    status                  INT          NOT NULL DEFAULT 1,
    rad_sababi              TEXT         NOT NULL,
    qizil_mfy_soni          INT          NOT NULL DEFAULT 0,
    istirohat_soni          INT          NOT NULL DEFAULT 0,
    transport_soni          INT          NOT NULL DEFAULT 0,
    masjid_soni             INT          NOT NULL DEFAULT 0,
    iio_tv_murojaati        INT          NOT NULL DEFAULT 0,
    uchrashuv_proof_url     VARCHAR(500) NOT NULL DEFAULT '',
    uchrashuv_proof_rasm    VARCHAR(500) NOT NULL DEFAULT '',
    oav_tv_soni             INT          NOT NULL DEFAULT 0,
    oav_tv_url              VARCHAR(500) NOT NULL DEFAULT '',
    oav_radio_soni          INT          NOT NULL DEFAULT 0,
    oav_radio_url           VARCHAR(500) NOT NULL DEFAULT '',
    oav_gazeta_jurnal_soni  INT          NOT NULL DEFAULT 0,
    oav_gazeta_jurnal_url   VARCHAR(500) NOT NULL DEFAULT '',
    oav_video_soni          INT          NOT NULL DEFAULT 0,
    oav_video_10k           INT          NOT NULL DEFAULT 0,
    oav_video_100k          INT          NOT NULL DEFAULT 0,
    oav_video_1m            INT          NOT NULL DEFAULT 0,
    oav_video_url           VARCHAR(500) NOT NULL DEFAULT '',
    oav_internet_soni       INT          NOT NULL DEFAULT 0,
    oav_internet_url        VARCHAR(500) NOT NULL DEFAULT '',
    mat_ijtimoiy_tarmoq     INT          NOT NULL DEFAULT 0,
    mat_oz_tashabbusi       INT          NOT NULL DEFAULT 0,
    mat_flayer_buklet       INT          NOT NULL DEFAULT 0,
    mat_led_ekran           INT          NOT NULL DEFAULT 0,
    mat_boshqa              INT          NOT NULL DEFAULT 0,
    mat_proof_url           VARCHAR(500) NOT NULL DEFAULT '',
    mat_proof_rasm          VARCHAR(500) NOT NULL DEFAULT '',
    suhbat_soni             INT          NOT NULL DEFAULT 0,
    suhbat_proof_url        VARCHAR(500) NOT NULL DEFAULT '',
    suhbat_proof_rasm       VARCHAR(500) NOT NULL DEFAULT '',
    iio_xizmat_soni         INT          NOT NULL DEFAULT 0,
    hamkor_tashkilot_soni   INT          NOT NULL DEFAULT 0,
    sayber_soni             INT          NOT NULL DEFAULT 0,
    yaratilgan              DATETIME     NOT NULL DEFAULT NOW(),
    yangilangan             DATETIME     NOT NULL DEFAULT NOW() ON UPDATE NOW(),
    UNIQUE KEY uq_viloyat_sana (viloyat_id, sana),
    FOREIGN KEY (viloyat_id) REFERENCES viloyat(id) ON DELETE CASCADE
);

-- hisobot: hamkor_xodim FK
SET @fk = (SELECT COUNT(1) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
           WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='hisobot'
           AND COLUMN_NAME='hamkor_xodim_id' AND REFERENCED_TABLE_NAME='hamkor_xodim');
SET @sfk = IF(@fk=0,
    'ALTER TABLE hisobot ADD CONSTRAINT fk_hisobot_hamkor_xodim FOREIGN KEY (hamkor_xodim_id) REFERENCES hamkor_xodim(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE st FROM @sfk; EXECUTE st; DEALLOCATE PREPARE st;

-- murojaat: yangi ustunlar
CALL safe_add_column('murojaat', 'viloyat_id',  'INT NULL');
CALL safe_add_column('murojaat', 'tuman_id',    'INT NULL');
CALL safe_add_column('murojaat', 'mahalla_id',  'INT NULL');
CALL safe_add_column('murojaat', 'usul_id',     'INT NULL');
CALL safe_add_column('murojaat', 'kasb_id',     'INT NULL');
CALL safe_add_column('murojaat', 'yaratuvchi_id', 'INT NULL');
CALL safe_add_column('murojaat', 'yangilangan', 'DATETIME NULL DEFAULT NOW() ON UPDATE NOW()');

-- murojaat_usul: ota_id
CALL safe_add_column('murojaat_usul', 'ota_id', 'INT NULL');

-- murojaat_kasb: ota_id, is_talaba
CALL safe_add_column('murojaat_kasb', 'ota_id',     'INT NULL');
CALL safe_add_column('murojaat_kasb', 'is_talaba',  'TINYINT(1) NOT NULL DEFAULT 0');

-- tuman: viloyat_id
CALL safe_add_column('tuman', 'viloyat_id', 'INT NULL');

-- Tozalash
DROP PROCEDURE IF EXISTS safe_add_column;

SELECT 'DB patch muvaffaqiyatli bajarildi!' AS natija;
