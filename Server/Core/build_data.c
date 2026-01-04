#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

typedef struct {
	char name[64];
	double x;
	double y;
} station;

typedef struct {
	char code[16];
	double price;
	double interval;
	double speed;
	int *stops;
	int stop_cnt;
} line;

typedef struct {
	line *lines;
	int n;
	int cap;
} line_list;

int station_find(station *a, int n, char *name) {
	int i;
	for (i = 0; i < n; i++) {
		if (strcmp(a[i].name, name) == 0) return i;
	}
	return -1;
}

double line_price(char *code) {
	if (!strcmp(code, "45")) return 3.0;
	if (!strcmp(code, "27")) return 3.0;
	if (!strcmp(code, "85")) return 4.0;
	return 2.0;
}

double line_interval(char *code) {
	if (!strncmp(code, "B", 1)) return 6.0;
	if (!strncmp(code, "Y", 1)) return 12.0;
	if (!strcmp(code, "85")) return 30.0;
	return 10.0;
}

double line_speed(char *code) {
	/* 速度单位：m/min（米/分钟）
	 * 这是大致行驶速度，不含停靠时间
	 * 普通公交车：25-30 km/h = 417-500 m/min
	 * BRT快速公交：30-40 km/h = 500-667 m/min
	 */
	if (!strncmp(code, "B", 1)) return 600.0; /* BRT:  36 km/h */
	if (!strncmp(code, "Y", 1)) return 450.0; /* 夜班: 27 km/h */
	if (!strcmp(code, "85")) return 700.0;    /* 85路:  42 km/h */
	return 500.0; /* 普通公路: 30 km/h */
}

/* 默认参考原点：常州北站[回车场]/常州北站 的经纬度，或者以第一个STOP的经纬度作为原点 */
int main() {
	FILE *in, *out;
	char buf[512];
	char code[16], sname[128], ename[128];
	int total_stop;
	int i, n_line;
	double lat, lon;
	double lat0, lon0;
	int have_origin;

	station *stas;
	int n_sta, cap_sta;

	line *lines;

	/* 读取 bus_source.txt（同目录下） */
	in = fopen("bus_source.txt", "r");
	if (!in) {
		printf("错误：无法打开 bus_source.txt\n");
		return -1;
	}

	lines = NULL;
	n_line = 0;

	stas = (station *)malloc(sizeof(station) * 1024);
	cap_sta = 1024;
	n_sta = 0;

	lat0 = 0.0;
	lon0 = 0.0;
	have_origin = 0;

	/* 第一遍：只为确定原点（寻找「常州北站」） */
	while (fgets(buf, sizeof(buf), in)) {
		if (! strncmp(buf, "STOP:", 5)) {
			int idx;
			char *p;
			p = buf + 5;
			while (*p == ' ' || *p == '\t') p++;
			/* STOP:  seq,name,lat,lon */
			/* 这里不管seq，直接用逗号分隔 */
			{
				char tmp[512];
				char *t, *arr[4];
				int cnt;

				strcpy(tmp, p);
				cnt = 0;
				t = strtok(tmp, ",\r\n");
				while (t && cnt < 4) {
					arr[cnt++] = t;
					t = strtok(NULL, ",\r\n");
				}
				if (cnt == 4) {
					strncpy(sname, arr[1], sizeof(sname) - 1);
					sname[sizeof(sname) - 1] = 0;
					lat = atof(arr[2]);
					lon = atof(arr[3]);

					if (! have_origin && strstr(sname, "常州北站")) {
						lat0 = lat;
						lon0 = lon;
						have_origin = 1;
						break;
					}
					if (! have_origin) {
						lat0 = lat;
						lon0 = lon;
					}
				}
			}
		}
	}
	rewind(in);

	/* 第二遍：正式解析各线路站点 */
	lines = (line *)malloc(sizeof(line) * 64);
	{
		int cap_line;
		cap_line = 64;

		while (fgets(buf, sizeof(buf), in)) {
			if (!strncmp(buf, "LINE:", 5)) {
				char tmp[512];
				char *t, *arr[8];
				int cnt;
				line ln;

				memset(&ln, 0, sizeof(line));

				strcpy(tmp, buf + 5);
				while (tmp[0] == ' ' || tmp[0] == '\t') memmove(tmp, tmp + 1, strlen(tmp));

				cnt = 0;
				t = strtok(tmp, ",\r\n");
				while (t && cnt < 8) {
					arr[cnt++] = t;
					t = strtok(NULL, ",\r\n");
				}
				if (cnt < 4) {
					printf("警告：LINE格式不正确：%s", buf);
					continue;
				}

				strncpy(ln.code, arr[0], 15);
				ln.code[15] = 0;

				total_stop = atoi(arr[3]);
				ln.stop_cnt = total_stop;
				ln.stops = (int *)malloc(sizeof(int) * ln.stop_cnt);

				ln.price = line_price(ln.code);
				ln.interval = line_interval(ln.code);
				ln.speed = line_speed(ln.code);

				/* 读取接下来 total_stop 行 STOP */
				for (i = 0; i < total_stop; i++) {
					if (!fgets(buf, sizeof(buf), in)) {
						printf("错误：线路%s站点数不足\n", ln.code);
						free(ln.stops);
						ln.stops = NULL;
						ln.stop_cnt = 0;
						break;
					}
					if (strncmp(buf, "STOP:", 5)) {
						printf("错误：期望STOP行，得到：%s", buf);
						free(ln.stops);
						ln.stops = NULL;
						ln.stop_cnt = 0;
						break;
					}

					{
						char tmp2[512];
						char *t2, *arr2[4];
						int cnt2;
						int sid;
						double x, y;
						double latv, lonv;
						double kx, ky;

						strcpy(tmp2, buf + 5);
						while (tmp2[0] == ' ' || tmp2[0] == '\t') memmove(tmp2, tmp2 + 1, strlen(tmp2));

						cnt2 = 0;
						t2 = strtok(tmp2, ",\r\n");
						while (t2 && cnt2 < 4) {
							arr2[cnt2++] = t2;
							t2 = strtok(NULL, ",\r\n");
						}
						if (cnt2 != 4) {
							printf("错误：STOP格式不正确：%s", buf);
							free(ln.stops);
							ln.stops = NULL;
							ln.stop_cnt = 0;
							break;
						}

						strncpy(sname, arr2[1], sizeof(sname) - 1);
						sname[sizeof(sname) - 1] = 0;
						latv = atof(arr2[2]);
						lonv = atof(arr2[3]);

						/* 经纬度 -> 平面坐标 */
						ky = 111000.0;
						kx = 111000.0 * cos(lat0 * 3.1415926 / 180.0);
						x = (lonv - lon0) * kx;
						y = (latv - lat0) * ky;

						sid = station_find(stas, n_sta, sname);
						if (sid == -1) {
							if (n_sta >= cap_sta) {
								cap_sta *= 2;
								stas = (station *)realloc(stas, sizeof(station) * cap_sta);
							}
							memset(&stas[n_sta], 0, sizeof(station));
							strncpy(stas[n_sta].name, sname, 63);
							stas[n_sta].name[63] = 0;
							stas[n_sta].x = x;
							stas[n_sta].y = y;
							sid = n_sta;
							n_sta++;
						}
						ln.stops[i] = sid;
					}
				}

				if (ln.stops && ln.stop_cnt > 0) {
					if (n_line >= cap_line) {
						cap_line *= 2;
						lines = (line *)realloc(lines, sizeof(line) * cap_line);
					}
					lines[n_line++] = ln;
				}
			}
		}
	}
	fclose(in);

	/* 输出到 bus_data.dat（同目录下） */
	out = fopen("bus_data.dat", "wb");
	if (!out) {
		printf("错误：无法创建 bus_data.dat\n");
		for (i = 0; i < n_line; i++) free(lines[i].stops);
		free(lines);
		free(stas);
		return -2;
	}

	fwrite(&n_sta, sizeof(int), 1, out);
	for (i = 0; i < n_sta; i++) {
		fwrite(stas[i].name, sizeof(char), 64, out);
		fwrite(&stas[i].x, sizeof(double), 1, out);
		fwrite(&stas[i].y, sizeof(double), 1, out);
	}

	fwrite(&n_line, sizeof(int), 1, out);
	for (i = 0; i < n_line; i++) {
		fwrite(lines[i].code, sizeof(char), 16, out);
		fwrite(&lines[i].price, sizeof(double), 1, out);
		fwrite(&lines[i].interval, sizeof(double), 1, out);
		fwrite(&lines[i].speed, sizeof(double), 1, out);
		fwrite(&lines[i].stop_cnt, sizeof(int), 1, out);
		fwrite(lines[i].stops, sizeof(int), lines[i].stop_cnt, out);
	}

	fclose(out);

	printf("生成成功：bus_data.dat\n");
	printf("站点数量：%d\n", n_sta);
	printf("线路数量：%d\n", n_line);
	printf("参考原点(默认常州北站)：lat0=%.6f lon0=%.6f\n", lat0, lon0);

	for (i = 0; i < n_line; i++) free(lines[i].stops);
	free(lines);
	free(stas);

	return 0;
}