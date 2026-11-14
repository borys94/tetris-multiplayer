{{- define "tetris.labels" -}}
app.kubernetes.io/name: tetris
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
tetris/environment: {{ .Values.environment }}
{{- end -}}

{{- define "tetris.selectorLabels" -}}
app.kubernetes.io/name: tetris
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}
