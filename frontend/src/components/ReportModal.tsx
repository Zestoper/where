import { useState } from "react";
import { createReport } from "../api/reports";
import type { Facility } from "../types/facility";
import "./ReportModal.css";

const REPORT_TYPES = [
  { id: "missing", label: "없어졌어요" },
  { id: "incorrect_info", label: "정보가 잘못됐어요" },
];

interface ReportModalProps {
  target: Facility | null;
  onClose: () => void;
}

export default function ReportModal({ target, onClose }: ReportModalProps) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0].id);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!target) return null;

  const handleClose = () => {
    setReportType(REPORT_TYPES[0].id);
    setDescription("");
    setSubmitting(false);
    setDone(false);
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createReport({
        location_id: target.id,
        report_type: reportType,
        description: description.trim() || undefined,
      });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-modal__backdrop" onClick={handleClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        {done ? (
          <>
            <p className="report-modal__done">제보 감사합니다 🙏</p>
            <button className="report-modal__submit" onClick={handleClose}>
              닫기
            </button>
          </>
        ) : (
          <>
            <h3 className="report-modal__title">{target.lname} 제보하기</h3>
            <div className="report-modal__types">
              {REPORT_TYPES.map((type) => (
                <button
                  key={type.id}
                  className={`report-modal__type-btn ${reportType === type.id ? "active" : ""}`}
                  onClick={() => setReportType(type.id)}
                >
                  {type.label}
                </button>
              ))}
            </div>
            <textarea
              className="report-modal__textarea"
              placeholder="상세 내용 (선택)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <div className="report-modal__actions">
              <button className="report-modal__cancel" onClick={handleClose}>
                취소
              </button>
              <button className="report-modal__submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "제출 중..." : "제보하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
