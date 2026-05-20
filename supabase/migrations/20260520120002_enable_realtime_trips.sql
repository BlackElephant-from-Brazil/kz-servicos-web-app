-- +goose Up
ALTER PUBLICATION supabase_realtime ADD TABLE trips;

-- +goose Down
ALTER PUBLICATION supabase_realtime DROP TABLE trips;
