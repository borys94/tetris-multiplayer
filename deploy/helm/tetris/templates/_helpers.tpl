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

{{- define "tetris.postgresSelectorLabels" -}}
app.kubernetes.io/name: postgres
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "tetris.postgresLabels" -}}
{{ include "tetris.postgresSelectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
tetris/environment: {{ .Values.environment }}
{{- end -}}

{{- define "tetris.backupLabels" -}}
app.kubernetes.io/name: postgres-backup
app.kubernetes.io/instance: {{ .Release.Name }}
tetris/environment: {{ .Values.environment }}
{{- end -}}
