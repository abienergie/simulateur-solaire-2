import React from 'react';
import { SolarParameters } from '../types';
import FormField from './FormField';
import FormFieldWithTooltip from './FormFieldWithTooltip';
import SelectFormField from './SelectFormField';
import PowerSelector from './PowerSelector';
import { ORIENTATION_OPTIONS, TILT_OPTIONS } from '../utils/orientationMapping';
import { SHADING_OPTIONS } from '../utils/constants/shadingOptions';
import OrientationCoefficientDisplay from './OrientationCoefficientDisplay';
import Tooltip from './Tooltip';

interface InstallationSectionProps {
  params: SolarParameters;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onParamsChange: (updates: Partial<SolarParameters>) => void;
}

export default function InstallationSection({
  params,
  onChange,
  onSelectChange,
  onParamsChange
}: InstallationSectionProps) {
  const handlePowerChange = (newPower: number) => {
    const nombreModules = Math.ceil((newPower * 1000) / params.puissanceModules);
    onParamsChange({ nombreModules });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Installation
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PowerSelector
          value={(params.nombreModules * params.puissanceModules) / 1000}
          onChange={handlePowerChange}
          typeCompteur={params.typeCompteur}
        />

        <FormField
          label="Nombre de modules"
          name="nombreModules"
          value={params.nombreModules}
          onChange={onChange}
          min={1}
          max={100}
          disabled={true}
        />

        <SelectFormField
          label="Inclinaison"
          name="inclinaison"
          value={params.inclinaison}
          onChange={onSelectChange}
          options={TILT_OPTIONS}
          unit="°"
        />

        <SelectFormField
          label="Orientation"
          name="orientation"
          value={params.orientation}
          onChange={onSelectChange}
          options={ORIENTATION_OPTIONS}
        />

        <FormFieldWithTooltip
          label="Pertes système"
          name="pertes"
          value={params.pertes}
          onChange={onChange}
          min={0}
          max={100}
          unit="%"
          tooltipContent="Les pertes système incluent les pertes dues aux câbles électriques, à la conversion DC/AC par l'onduleur, aux salissures sur les panneaux, et aux variations de température."
        />

        <SelectFormField
          label="Masque solaire"
          name="masqueSolaire"
          value={params.masqueSolaire}
          onChange={onSelectChange}
          options={SHADING_OPTIONS}
        />

        <div className="md:col-span-2">
          <OrientationCoefficientDisplay
            orientation={params.orientation}
            inclinaison={params.inclinaison}
          />
        </div>
      </div>
    </div>
  );
}