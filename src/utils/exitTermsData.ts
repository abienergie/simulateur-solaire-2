import { PowerTerms } from '../types/exitTerms';
import { exitTerms3kw } from './data/exitTerms3kw';
import { exitTerms3_5kw } from './data/exitTerms3_5kw';

const exitTerms2_5kw: PowerTerms = {
  power: '2.5',
  terms: [
    {
      duration: 25,
      monthlyPayment: 49.00,
      yearlyValues: {
        1: 0, 2: 5269, 3: 5197, 4: 5108, 5: 5028, 6: 4978, 7: 4931, 8: 4910, 9: 4876, 10: 4827,
        11: 4761, 12: 4675, 13: 4567, 14: 4433, 15: 4271, 16: 4076, 17: 3843, 18: 3569, 19: 3246,
        20: 2870, 21: 2432, 22: 1924, 23: 1338, 24: 662, 25: 0
      }
    },
    {
      duration: 20,
      monthlyPayment: 51.60,
      yearlyValues: {
        1: 0, 2: 5190, 3: 5071, 4: 4930, 5: 4937, 6: 4747, 7: 4685, 8: 4594, 9: 4476, 10: 4327,
        11: 4144, 12: 3920, 13: 3649, 14: 3327, 15: 2944, 16: 2492, 17: 1961, 18: 1342, 19: 620,
        20: 0
      }
    },
    {
      duration: 15,
      monthlyPayment: 56.40,
      yearlyValues: {
        1: 0, 2: 5043, 3: 4916, 4: 4818, 5: 4636, 6: 4430, 7: 4191, 8: 3979, 9: 3721, 10: 3412,
        11: 3044, 12: 2608, 13: 2095, 14: 775, 15: 0
      }
    },
    {
      duration: 10,
      monthlyPayment: 67.20,
      yearlyValues: {
        1: 0, 2: 4714, 3: 4463, 4: 4164, 5: 3755, 6: 3387, 7: 2748, 8: 1893, 9: 863, 10: 0
      }
    }
  ]
};

export const exitTermsData: PowerTerms[] = [
  exitTerms2_5kw,
  exitTerms3kw,
  exitTerms3_5kw
];