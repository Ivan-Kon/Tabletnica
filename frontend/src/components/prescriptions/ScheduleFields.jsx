import { Plus, X } from "lucide-react";
import { Button } from "../common/UI.jsx";
export default function ScheduleFields({ value, onChange, index }) {
  const update = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="schedule-fields">
      <label>
        Тип расписания
        <select
          value={value.schedule_type}
          onChange={(e) => update({ schedule_type: e.target.value })}
        >
          <option value="SPECIFIC_TIME">В конкретное время</option>
          <option value="INTERVAL">Через интервал</option>
        </select>
      </label>
      {value.schedule_type === "SPECIFIC_TIME" ? (
        <>
          <span className="field-label">Время выдачи · московское время</span>
          <div className="time-inputs">
            {value.specific_times.map((time, i) => (
              <div className="time-input" key={i}>
                <input
                  type="time"
                  required
                  aria-label={`Время ${i + 1} препарата ${index + 1}`}
                  value={time}
                  onInput={(e) =>
                    update({
                      specific_times: value.specific_times.map((t, n) =>
                        n === i ? e.target.value : t,
                      ),
                    })
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  disabled={value.specific_times.length === 1}
                  aria-label={`Удалить время ${i + 1}`}
                  onClick={() =>
                    update({
                      specific_times: value.specific_times.filter(
                        (_, n) => n !== i,
                      ),
                    })
                  }
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <Button
              type="button"
              className="secondary"
              onClick={() =>
                update({ specific_times: [...value.specific_times, ""] })
              }
            >
              <Plus size={16} />
              Добавить время
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="form-grid">
            <label>
              Интервал, часов
              <input
                type="number"
                required
                min="0.25"
                max="168"
                step="0.25"
                value={value.interval_minutes / 60}
                onChange={(e) =>
                  update({ interval_minutes: Number(e.target.value) * 60 })
                }
              />
            </label>
            <label>
              Точка отсчёта · МСК
              <input
                type="datetime-local"
                required
                value={value.anchor_at.slice(0, 16)}
                onInput={(e) =>
                  update({ anchor_at: `${e.target.value}:00+03:00` })
                }
              />
            </label>
          </div>
          <div className="notice">
            Ночные часы включены. Например: каждые 6 часов с 21:30 → 21:30,
            03:30, 09:30, 15:30.
          </div>
        </>
      )}
    </div>
  );
}
