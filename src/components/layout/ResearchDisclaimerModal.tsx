import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { ShieldAlert, FileCheck, CheckCircle2, Lock } from 'lucide-react';

export const ResearchDisclaimerModal: React.FC = () => {
  const { complianceModalOpen, setComplianceModalOpen, acknowledgeResearchOnly } = useStore();
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);
  const [agreed3, setAgreed3] = useState(false);

  const canProceed = agreed1 && agreed2 && agreed3;

  const handleConfirm = () => {
    if (canProceed) {
      acknowledgeResearchOnly();
    }
  };

  return (
    <Modal
      isOpen={complianceModalOpen}
      onClose={() => setComplianceModalOpen(false)}
      title={
        <div className="flex items-center gap-2 text-slate-900">
          <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
          <span>Research-Use Compliance Verification</span>
        </div>
      }
      description="UK & EU In-Vitro Regulatory Governance Protocol"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-amber-950 space-y-1.5 font-mono text-[11px]">
          <p className="font-bold flex items-center gap-1.5 text-amber-900">
            <Lock className="h-3.5 w-3.5" />
            STRICTLY RESTRICTED TO QUALIFIED INSTITUTIONAL RESEARCH
          </p>
          <p className="text-stone-700 leading-normal font-sans text-xs">
            The compounds catalogued on this platform are synthesized to analytical standards (≥99.0%
            HPLC purity) solely for in-vitro receptor binding assays, chromatography calibration, and
            biochemical experimentation.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Checkbox
            checked={agreed1}
            onChange={(e) => setAgreed1(e.target.checked)}
            label={<span className="font-semibold text-slate-900">Authorized Investigator Declaration</span>}
            description="I confirm I am an authorized academic researcher, scientific technician, or corporate laboratory representative acting within lawful UK/EU research guidelines."
          />

          <Checkbox
            checked={agreed2}
            onChange={(e) => setAgreed2(e.target.checked)}
            label={<span className="font-semibold text-slate-900">No Human or Animal Administration</span>}
            description="I acknowledge that under NO circumstances will these substances be utilized for human ingestion, clinical therapy, in-vivo human administration, or cosmetic formulation."
          />

          <Checkbox
            checked={agreed3}
            onChange={(e) => setAgreed3(e.target.checked)}
            label={<span className="font-semibold text-slate-900">Safety & Storage Protocols</span>}
            description="I affirm that our facility maintains standard laboratory safety equipment, cold-storage (-20°C) capabilities, and hazardous material disposal procedures."
          />
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-stone-200">
          <button
            onClick={() => setComplianceModalOpen(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            Cancel
          </button>
          <Button
            variant="gold"
            size="md"
            disabled={!canProceed}
            onClick={handleConfirm}
            className="gap-2 font-mono text-xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Verify & Continue</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
