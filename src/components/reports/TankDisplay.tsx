
import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft } from 'lucide-react';

interface TankDisplayProps {
  tanqueValues: number[];
  onTanqueChange: (index: number, value: number[]) => void;
  onBackToProducts: () => void;
}

const TankDisplay: React.FC<TankDisplayProps> = ({ 
  tanqueValues, 
  onTanqueChange, 
  onBackToProducts 
}) => {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToProducts}
          className="p-1"
        >
          <ArrowLeft size={20} />
        </Button>
        <h3 className="text-lg font-semibold">Tanques de Aceite de Cártamo</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tanqueValues.map((value, index) => (
          <div key={index} className="space-y-4 p-4 border rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Tanque {index + 1}</h3>
              <span className="text-2xl font-bold text-blue-600">{value}/10</span>
            </div>
            <Slider
              value={[value]}
              onValueChange={(newValue) => onTanqueChange(index, newValue)}
              max={10}
              min={0}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
            <div className="mt-2">
              <div 
                className="bg-blue-500 rounded transition-all duration-300" 
                style={{ 
                  height: '100px', 
                  width: '100%',
                  background: `linear-gradient(to top, #3b82f6 ${(value / 10) * 100}%, #e5e7eb ${(value / 10) * 100}%)`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TankDisplay;
