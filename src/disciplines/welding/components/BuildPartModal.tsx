import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { useLocation } from 'react-router-dom';

import { useSupabase } from './SupabaseProvider';

import { fetchSpecBook } from '../modules/specbookSupabase';

import { ProjectCard } from './PartMatcherModal';

import jsPDF from 'jspdf';

import { groupMaterialsBySupplierType, getEstimatedPrice } from '../utils/materialMapping';



interface BuildMenuModalProps {

  open: boolean;

  onClose: () => void;

  onFindMarkets: (selectedProjects: ProjectCard[]) => void;

}



const BuildMenuModal: React.FC<BuildMenuModalProps> = ({ open, onClose, onFindMarkets }) => {

  const { t } = useTranslation();

  const location = useLocation();

  const disciplineFromPath = location.pathname.split('/').filter(Boolean)[0] || 'welding';

  const discipline = disciplineFromPath === 'welding' ? 'machining' : disciplineFromPath;

  const bt = (key: string, defaultValue: string) =>

    t(`buildMenu.disciplineCopy.${discipline}.${key}`, {

      defaultValue: t(`buildMenu.${key}`, { defaultValue })

    });

  const { user } = useSupabase();

  const [projects, setProjects] = useState<ProjectCard[]>([]);

  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);



  useEffect(() => {

    if (open && user?.id) {

      loadProjects();

    }

  }, [open, user?.id]);



  const loadProjects = async () => {

    if (!user?.id) return;

    

    try {

      setLoading(true);

      const savedProjects = await fetchSpecBook(user.id);

      setProjects(savedProjects || []);

    } catch (err) {

      console.error('Error loading spec book projects:', err);

      setProjects([]);

    } finally {

      setLoading(false);

    }

  };



  const toggleProject = (projectId: string) => {

    const newSelected = new Set(selectedProjectIds);

    if (newSelected.has(projectId)) {

      newSelected.delete(projectId);

    } else {

      newSelected.add(projectId);

    }

    setSelectedProjectIds(newSelected);

  };



  const handleFindMarkets = () => {

    const selected = projects.filter(r => selectedProjectIds.has(r.id));

    onFindMarkets(selected);

  };



  const handleCreateMenuPDF = () => {

    const selected = projects.filter(r => selectedProjectIds.has(r.id));

    if (selected.length === 0) return;



    const pdf = new jsPDF();

    let yPos = 20;



    // Title

    pdf.setFontSize(20);

    pdf.setFont('helvetica', 'bold');

    pdf.text(bt('myMenu', 'My Job Package'), 105, yPos, { align: 'center' });

    yPos += 15;



    // Menu Items

    pdf.setFontSize(14);

    pdf.text(bt('selectedProjects', 'Selected Jobs'), 20, yPos);

    yPos += 8;

    pdf.setFontSize(11);

    pdf.setFont('helvetica', 'normal');

    selected.forEach((project, idx) => {

      pdf.text(`${idx + 1}. ${project.title}`, 25, yPos);

      yPos += 6;

    });

    yPos += 5;



    // Extract and deduplicate materials

    const allIngredients: string[] = [];

    selected.forEach(project => {

      if (project.ingredients && Array.isArray(project.ingredients)) {

        allIngredients.push(...project.ingredients);

      }

    });

    const uniqueIngredients = Array.from(

      new Set(allIngredients.map(ing => ing.toLowerCase()))

    ).map(ing => allIngredients.find(original => original.toLowerCase() === ing) || ing);

    const materialsByType = groupMaterialsBySupplierType(uniqueIngredients);



    // Shopping List by Market Type

    pdf.setFontSize(14);

    pdf.setFont('helvetica', 'bold');

    pdf.text('MATERIALS & TOOLING CHECKLIST', 20, yPos);

    yPos += 8;



    const marketTypeLabels: Record<string, string> = {

      seafood: '🧪 Specialty Supply',

      butcher: '🔩 Metal & Consumables',

      produce: '🧰 Tools & Accessories',

      dairy: '🧯 Safety / PPE',

      grocery: '🏪 General Supplier',

      deli: '🏬 Distributor',

      farms: '🏭 Fabrication Yard'

    };



    Object.entries(materialsByType).forEach(([type, materials]) => {

      if (materials.length === 0) return;

      

      // Check if we need a new page

      if (yPos > 250) {

        pdf.addPage();

        yPos = 20;

      }



      pdf.setFontSize(12);

      pdf.setFont('helvetica', 'bold');

      pdf.text(marketTypeLabels[type] || type, 20, yPos);

      yPos += 6;



      pdf.setFontSize(10);

      pdf.setFont('helvetica', 'normal');

      let subtotal = 0;

      (materials as string[]).forEach(ing => {

        const priceInfo = getEstimatedPrice(ing);

        const priceText = priceInfo ? ` ~$${priceInfo.price}/${priceInfo.unit}` : '';

        pdf.text(`• ${ing}${priceText}`, 25, yPos);

        if (priceInfo) subtotal += priceInfo.price;

        yPos += 5;

      });



      if (subtotal > 0) {

        pdf.setFont('helvetica', 'italic');

        pdf.text(`Estimated subtotal: ~$${subtotal.toFixed(2)}`, 25, yPos);

        yPos += 7;

      }

      yPos += 3;

    });



    // Footer

    if (yPos > 250) {

      pdf.addPage();

      yPos = 20;

    }

    yPos += 10;

    pdf.setFontSize(9);

    pdf.setFont('helvetica', 'italic');

    pdf.text('Generated by PorkChop Ed Tech', 105, yPos, { align: 'center' });

    pdf.text('Cost estimates are approximate', 105, yPos + 5, { align: 'center' });



    // Download

    pdf.save('job-package.pdf');

  };



  if (!open) return null;



  return (

    <div className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>

      <div className="bg-white rounded-lg shadow-xl border-4 border-maineBlue max-w-4xl w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">

          {/* Header */}

          <div className="flex justify-between items-center mb-4">

            <h2 className="text-2xl font-bold text-maineBlue font-retro">🧾 {bt('title', 'Build Job Package')}</h2>

            <button 

              onClick={onClose}

              className="text-gray-500 hover:text-gray-700 text-2xl"

            >

              ×

            </button>

          </div>



          {/* Instructions */}

          <p className="text-sm text-gray-600 mb-4">

            {bt('selectRecipes', 'Select jobs from your Weldbook to build a package and tooling checklist.')}

          </p>



          {/* Two Column Layout */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 flex-1 overflow-hidden">

            {/* Left: Recipe Picklist */}

            <div className="flex flex-col overflow-hidden">

              <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 {bt('availableItems', 'Available Jobs')}</h3>

              {loading ? (

                <div className="text-center py-8">

                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maineBlue mx-auto"></div>

                  <p className="text-gray-500 mt-2">{bt('loading', 'Loading jobs...')}</p>

                </div>

              ) : projects.length === 0 ? (

                <div className="text-center py-8">

                  <p className="text-gray-500 text-sm">{bt('noItems', 'No jobs found in your Weldbook yet.')}</p>

                </div>

              ) : (

                <div className="space-y-2 overflow-y-auto pr-2" style={{maxHeight: '280px'}}>

                  {projects.map((project) => (

                    <label

                      key={project.id}

                      className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${

                        selectedProjectIds.has(project.id)

                          ? 'border-maineBlue bg-blue-50'

                          : 'border-gray-200 hover:border-gray-300'

                      }`}

                    >

                      <input

                        type="checkbox"

                        checked={selectedProjectIds.has(project.id)}

                        onChange={() => toggleProject(project.id)}

                        className="mr-2 h-4 w-4 text-maineBlue"

                      />

                      <div className="flex-1 min-w-0">

                        <div className="font-medium text-sm text-gray-900 truncate">{project.title}</div>

                        {project.ingredients && (

                          <div className="text-xs text-gray-400">

                            {bt('itemsCount', '{count} materials').replace('{count}', project.ingredients.length.toString())}

                          </div>

                        )}

                      </div>

                    </label>

                  ))}

                </div>

              )}

            </div>



            {/* Right: Your Menu */}

            <div className="flex flex-col overflow-hidden">

              <h3 className="text-sm font-semibold text-gray-700 mb-2">🧰 {bt('yourMenu', 'Your Job Package')}</h3>

              {selectedProjectIds.size === 0 ? (

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">

                  <p className="text-gray-400 text-sm">{bt('selectToStart', 'Select one or more jobs to start your package.')}</p>

                </div>

              ) : (

                <div className="space-y-2 overflow-y-auto pr-2" style={{maxHeight: '280px'}}>

                  {projects

                    .filter(r => selectedProjectIds.has(r.id))

                    .map((project, idx) => (

                      <div

                        key={project.id}

                        className="p-3 bg-sand rounded-lg border border-maineBlue"

                      >

                        <div className="flex items-start justify-between">

                          <div className="flex-1">

                            <div className="font-medium text-gray-900">{idx + 1}. {project.title}</div>

                            {project.ingredients && (

                              <div className="text-xs text-gray-500 mt-1">

                                {bt('itemsCountNeeded', '{count} materials needed').replace('{count}', project.ingredients.length.toString())}

                              </div>

                            )}

                          </div>

                          <button

                            onClick={() => toggleProject(project.id)}

                            className="text-red-500 hover:text-red-700 ml-2"

                            title={bt('removeFromMenu', 'Remove from package')}

                          >

                            ✕

                          </button>

                        </div>

                      </div>

                    ))}

                </div>

              )}

            </div>

          </div>



          {/* Footer */}

          <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">

            <div className="text-sm text-gray-600">

              {selectedProjectIds.size} {bt('projectsSelected', 'jobs selected')}

            </div>

            <div className="flex gap-2">

              <button

                onClick={onClose}

                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"

              >

                {bt('cancel', 'Cancel')}

              </button>

              <button

                onClick={handleCreateMenuPDF}

                disabled={selectedProjectIds.size === 0}

                className={`px-4 py-2 rounded font-bold transition-colors ${

                  selectedProjectIds.size === 0

                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'

                    : 'bg-seafoam text-maineBlue hover:bg-maineBlue hover:text-seafoam border border-maineBlue'

                }`}

              >

                📄 {bt('createMenuPDF', 'Create Job Package PDF')}

              </button>

              <button

                onClick={handleFindMarkets}

                className="px-6 py-2 rounded font-bold transition-colors bg-red-600 text-white hover:bg-red-700 border border-red-600"

              >

                🏭 {bt('findMarkets', "Find Tooling Vendors")}

              </button>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};



export default BuildMenuModal;

