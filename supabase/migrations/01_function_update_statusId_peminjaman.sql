CREATE OR REPLACE FUNCTION check_and_update_peminjaman_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the current time is after 4 PM on weekdays or after 12 PM on Saturday
  IF (EXTRACT(DOW FROM now() AT TIME ZONE 'GMT' + INTERVAL '7 hours') BETWEEN 1 AND 5 AND 
      EXTRACT(HOUR FROM now() AT TIME ZONE 'GMT' + INTERVAL '7 hours') >= 16) OR
      (EXTRACT(DOW FROM now() AT TIME ZONE 'GMT' + INTERVAL '7 hours') = 6 AND 
      EXTRACT(HOUR FROM now() AT TIME ZONE 'GMT' + INTERVAL '7 hours') >= 12) THEN
    UPDATE public."Peminjaman"
    SET "statusId" = 6
    WHERE "tanggalPengembalian" < (now() AT TIME ZONE 'GMT' + INTERVAL '7 hours');
  END IF;
  RETURN NULL; -- Triggers that do not modify the row should return NULL
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_peminjaman_status_trigger
AFTER INSERT OR UPDATE ON public."Peminjaman"
FOR EACH ROW
EXECUTE FUNCTION check_and_update_peminjaman_status();