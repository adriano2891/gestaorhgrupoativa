import { useState } from "react";
import { Search, Filter, Clock, Star } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HR_TEMPLATES } from "@/constants/hrflow-templates";
import { CATEGORY_LABELS, CATEGORY_COLORS, FormCategory } from "@/types/hrflow";
import { HRFlowFormBuilder } from "./HRFlowFormBuilder";

export const HRFlowTemplates = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof HR_TEMPLATES[0] | null>(null);

  const filteredTemplates = HR_TEMPLATES.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "todos" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const popularTemplates = HR_TEMPLATES.filter(t => t.popular);

  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.FileText;
    return Icon;
  };

  if (selectedTemplate) {
    return (
      <HRFlowFormBuilder 
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)} 
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Biblioteca de Templates</h1>
        <p className="text-gray-500">Mais de 20 modelos prontos para uso em processos de RH</p>
      </div>

      {/* Popular Templates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          Templates Populares
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularTemplates.map((template) => {
            const Icon = getIcon(template.icon);
            return (
              <Card 
                key={template.id} 
                className="border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => setSelectedTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{template.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{template.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge className={CATEGORY_COLORS[template.category as FormCategory]}>
                      {CATEGORY_LABELS[template.category as FormCategory]}
                    </Badge>
                    {template.estimatedTime && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {template.estimatedTime}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white border-gray-200"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48 bg-white border-gray-200">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas Categorias</SelectItem>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* All Templates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Todos os Templates ({filteredTemplates.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const Icon = getIcon(template.icon);
            return (
              <Card 
                key={template.id} 
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setSelectedTemplate(template)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-[#2563eb] transition-colors">
                      <Icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{template.title}</h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.fields.length} campos
                        </Badge>
                        {template.estimatedTime && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {template.estimatedTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
