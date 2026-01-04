#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#ifdef _WIN32
#include <windows.h>
#endif

#define INF 1e9

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

typedef struct arcnode {
	int to;
	double w;
	int line_idx;
	struct arcnode *next;
} arcnode;

typedef struct {
	int n;
	int m;
	arcnode **head;
} adj;

double euclid_dist(station *s1, station *s2) {
	double dx, dy;
	dx = s1->x - s2->x;
	dy = s1->y - s2->y;
	return sqrt(dx * dx + dy * dy);
}

int find_station(char *name, station *stations, int n) {
	int i;
	for (i = 0; i < n; i++) {
		if (strcmp(stations[i].name, name) == 0) {
			return i;
		}
	}
	return -1;
}

int fuzzy_match_stations(char *keyword, station *stations, int n, int *matches, int max_matches) {
	int i, count = 0;
	for (i = 0; i < n && count < max_matches; i++) {
		if (strstr(stations[i].name, keyword) != NULL) {
			matches[count++] = i;
		}
	}
	return count;
}

int load_data(char *filename, station **stations, int *n_sta, line **lines, int *n_line) {
	FILE *f;
	int i, j;
	
	f = fopen(filename, "rb");
	if (!f) {
		return -1;
	}
	
	if (fread(n_sta, sizeof(int), 1, f) != 1) {
		fclose(f);
		return -2;
	}
	
	*stations = (station *)malloc(sizeof(station) * (*n_sta));
	if (!(*stations)) {
		fclose(f);
		return -3;
	}
	
	for (i = 0; i < *n_sta; i++) {
		if (fread((*stations)[i].name, sizeof(char), 64, f) != 64) {
			free(*stations);
			fclose(f);
			return -2;
		}
		if (fread(&(*stations)[i].x, sizeof(double), 1, f) != 1) {
			free(*stations);
			fclose(f);
			return -2;
		}
		if (fread(&(*stations)[i].y, sizeof(double), 1, f) != 1) {
			free(*stations);
			fclose(f);
			return -2;
		}
	}
	
	if (fread(n_line, sizeof(int), 1, f) != 1) {
		free(*stations);
		fclose(f);
		return -2;
	}
	
	*lines = (line *)malloc(sizeof(line) * (*n_line));
	if (!(*lines)) {
		free(*stations);
		fclose(f);
		return -3;
	}
	
	for (i = 0; i < *n_line; i++) {
		if (fread((*lines)[i].code, sizeof(char), 16, f) != 16) {
			free(*stations);
			for (j = 0; j < i; j++) free((*lines)[j].stops);
			free(*lines);
			fclose(f);
			return -2;
		}
		if (fread(&(*lines)[i].price, sizeof(double), 1, f) != 1) {
			free(*stations);
			for (j = 0; j < i; j++) free((*lines)[j].stops);
			free(*lines);
			fclose(f);
			return -2;
		}
		if (fread(&(*lines)[i].interval, sizeof(double), 1, f) != 1) {
			free(*stations);
			for (j = 0; j < i; j++) free((*lines)[j].stops);
			free(*lines);
			fclose(f);
			return -2;
		}
		if (fread(&(*lines)[i].speed, sizeof(double), 1, f) != 1) {
			free(*stations);
			for (j = 0; j < i; j++) free((*lines)[j].stops);
			free(*lines);
			fclose(f);
			return -2;
		}
		if (fread(&(*lines)[i].stop_cnt, sizeof(int), 1, f) != 1) {
			free(*stations);
			for (j = 0; j < i; j++) free((*lines)[j].stops);
			free(*lines);
			fclose(f);
			return -2;
		}
		
		(*lines)[i].stops = (int *)malloc(sizeof(int) * (*lines)[i].stop_cnt);
		if (!(*lines)[i].stops) {
			free(*stations);
			for (j = 0; j < i; j++) free((*lines)[j].stops);
			free(*lines);
			fclose(f);
			return -3;
		}
		
		if (fread((*lines)[i].stops, sizeof(int), (*lines)[i].stop_cnt, f) != (*lines)[i].stop_cnt) {
			free(*stations);
			for (j = 0; j <= i; j++) free((*lines)[j].stops);
			free(*lines);
			fclose(f);
			return -2;
		}
	}
	
	fclose(f);
	return 0;
}

void add_edge(adj *g, int u, int v, double w, int line_idx) {
	arcnode *p;
	p = (arcnode *)malloc(sizeof(arcnode));
	if (!p) {
		/* 内存分配失败 */
		fprintf(stderr, "{\"success\": false,\"message\":\"内存分配失败\"}\n");
		exit(1);
	}
	p->to = v;
	p->w = w;
	p->line_idx = line_idx;
	p->next = g->head[u];
	g->head[u] = p;
}

adj *adj_build_extended(station *stations, int n_sta, line *lines, int n_line, int mode, int start_id) {
	adj *g;
	int i, j, k, u, v, state_u, state_v;
	double w, dist;
	int n_states;
	int super_src;
	
	n_states = n_sta * n_line + 1;
	super_src = n_sta * n_line;
	
	g = (adj *)malloc(sizeof(adj));
	g->n = n_states;
	g->m = 0;
	g->head = (arcnode **)malloc(sizeof(arcnode *) * n_states);
	for (i = 0; i < n_states; i++) {
		g->head[i] = NULL;
	}
	
	for (i = 0; i < n_line; i++) {
		int on_line = 0;
		for (j = 0; j < lines[i].stop_cnt; j++) {
			if (lines[i].stops[j] == start_id) {
				on_line = 1;
				break;
			}
		}
		if (on_line) {
			state_u = start_id * n_line + i;
			if (mode == 1) {
				w = lines[i].price;
			} else {
				w = 0.0;
			}
			add_edge(g, super_src, state_u, w, i);
			g->m++;
		}
	}
	
	for (i = 0; i < n_line; i++) {
		for (j = 0; j < lines[i].stop_cnt - 1; j++) {
			u = lines[i].stops[j];
			v = lines[i].stops[j + 1];
			state_u = u * n_line + i;
			state_v = v * n_line + i;
			
			if (mode == 1) {
				w = 0.0;
			} else {
				/* 计算站间距离（米） */
				dist = euclid_dist(&stations[u], &stations[v]);
				
				/* 道路弯曲系数：实际道路比直线距离长约20% */
				dist = dist * 1.2;
				
				/* 行驶时间（秒） = 距离（米） / 速度（米/分钟） * 60 */
				w = (dist / lines[i].speed) * 60.0;
				
				/* 加上停靠时间：每个站点停靠30秒 */
				w = w + 30.0;
			}
			
			add_edge(g, state_u, state_v, w, i);
			add_edge(g, state_v, state_u, w, i);
			g->m += 2;
		}
	}
	
	for (i = 0; i < n_sta; i++) {
		for (j = 0; j < n_line; j++) {
			int on_line_j = 0;
			for (k = 0; k < lines[j].stop_cnt; k++) {
				if (lines[j].stops[k] == i) {
					on_line_j = 1;
					break;
				}
			}
			if (! on_line_j) continue;
			
			for (k = 0; k < n_line; k++) {
				if (k == j) continue;
				
				int on_line_k = 0;
				int m;
				for (m = 0; m < lines[k].stop_cnt; m++) {
					if (lines[k].stops[m] == i) {
						on_line_k = 1;
						break;
					}
				}
				if (!on_line_k) continue;
				
				state_u = i * n_line + j;
				state_v = i * n_line + k;
				
				if (mode == 1) {
					w = lines[k].price;
				} else if (mode == 2) {
					/* 模式2：最快不等车，换乘需要步行时间，设为5分钟（300秒） */
					w = 300.0;
				} else {
					/* 模式3：最快等车，换乘需要步行+等车时间 
					 * 【Bug 修复】interval 单位是分钟，需要转换为秒
					 * 等车时间 = interval / 2（平均等待，分钟）
					 * 步行时间 = 300秒（5分钟）
					 */
					w = (lines[k].interval / 2.0) * 60.0 + 300.0;
				}
				
				add_edge(g, state_u, state_v, w, k);
				g->m++;
			}
		}
	}
	
	return g;
}

void adj_free(adj *g) {
	arcnode *p, *t;
	int i;
	for (i = 0; i < g->n; i++) {
		p = g->head[i];
		while (p) {
			t = p;
			p = p->next;
			free(t);
		}
	}
	free(g->head);
	free(g);
}

void dijkstra_double(adj *g, int s, double *dist, int *pre) {
	char *vis;
	arcnode *p;
	int i, j, best;
	int u, v;
	
	vis = (char *)calloc(g->n, sizeof(char));
	
	for (i = 0; i < g->n; i++) {
		dist[i] = INF;
		pre[i] = -1;
	}
	dist[s] = 0.0;
	
	for (i = 0; i < g->n; i++) {
		best = -1;
		for (j = 0; j < g->n; j++) {
			if (! vis[j] && (best == -1 || dist[j] < dist[best])) {
				best = j;
			}
		}
		
		if (best == -1 || dist[best] >= INF) break;
		
		vis[best] = 1;
		p = g->head[best];
		while (p) {
			u = best;
			v = p->to;
			if (! vis[v] && dist[u] + p->w < dist[v]) {
				dist[v] = dist[u] + p->w;
				pre[v] = u;
			}
			p = p->next;
		}
	}
	
	free(vis);
}

int recover_path(int *pre, int s, int t, int *path, int max_len) {
	int len, i, cur;
	int *temp;
	
	if (pre[t] == -1 && s != t) {
		return 0;
	}
	
	temp = (int *)malloc(sizeof(int) * max_len);
	
	len = 0;
	cur = t;
	while (cur != -1 && len < max_len) {
		temp[len++] = cur;
		if (cur == s) break;
		cur = pre[cur];
	}
	
	for (i = 0; i < len; i++) {
		path[i] = temp[len - 1 - i];
	}
	
	free(temp);
	return len;
}

void output_json(int *path, int len, station *stations, line *lines, int n_sta, int n_line, double cost, int mode) {
	int i, j;
	int cur_line_idx, next_line_idx;
	int sta_id;
	int seg_start;
	int transfer_count = 0;
	
	printf("{");
	printf("\"success\":true,");
	
	if (len == 0 || path[0] == n_sta * n_line) {
		if (len <= 1) {
			printf("\"success\":false,");
			printf("\"message\":\"未找到路径\"");
			printf("}");
			return;
		}
		path++;
		len--;
	}
	
	/* 计算换乘次数 */
	cur_line_idx = path[0] % n_line;
	for (i = 1; i < len; i++) {
		next_line_idx = path[i] % n_line;
		if (next_line_idx != cur_line_idx) {
			transfer_count++;
			cur_line_idx = next_line_idx;
		}
	}
	
	/* 输出基础信息 */
	sta_id = path[0] / n_line;
	printf("\"start\":\"%s\",", stations[sta_id].name);
	sta_id = path[len - 1] / n_line;
	printf("\"end\":\"%s\",", stations[sta_id].name);
	printf("\"transfers\":%d,", transfer_count);
	
	if (mode == 1) {
		printf("\"totalCost\": %.2f,", cost);
		printf("\"costUnit\":\"元\",");
	} else {
		printf("\"totalTime\":%.2f,", cost / 60.0);
		printf("\"timeUnit\":\"分钟\",");
	}
	
	/* 输出路径段 */
	printf("\"segments\":[");
	seg_start = 0;
	cur_line_idx = path[0] % n_line;
	int first_seg = 1;
	
	for (i = 1; i < len; i++) {
		next_line_idx = path[i] % n_line;
		
		if (next_line_idx != cur_line_idx) {
			if (!first_seg) printf(",");
			first_seg = 0;
			
			printf("{");
			printf("\"line\":\"%s\",", lines[cur_line_idx].code);
			printf("\"stations\":[");
			for (j = seg_start; j < i; j++) {
				sta_id = path[j] / n_line;
				printf("\"%s\"", stations[sta_id].name);
				if (j < i - 1) printf(",");
			}
			printf("]");
			printf("}");
			
			seg_start = i;
			cur_line_idx = next_line_idx;
		}
	}
	
	/* 最后一段 */
	if (! first_seg) printf(",");
	printf("{");
	printf("\"line\":\"%s\",", lines[cur_line_idx].code);
	printf("\"stations\":[");
	for (j = seg_start; j < len; j++) {
		sta_id = path[j] / n_line;
		printf("\"%s\"", stations[sta_id].name);
		if (j < len - 1) printf(",");
	}
	printf("]");
	printf("}");
	
	printf("]");
	printf("}");
}

int main(int argc, char *argv[]) {
	station *stations;
	line *lines;
	int n_sta, n_line;
	int mode, ret;
	int start_id, end_id;
	adj *g;
	double *dist;
	int *pre;
	int *path;
	int path_len;
	int i, end_state, super_src;
	double min_cost;
	char *data_file = "Data/Source/bus_data.dat";  /* 默认数据文件路径 */
	
	/* 参数检查 */
	if (argc < 4) {
		printf("{\"success\":false,\"message\": \"参数不足：需要 起点 终点 模式(1=最便宜,2=最快不等车,3=最快等车)\"}");
		return -1;
	}
	
	/* 如果提供了数据文件路径 */
	if (argc >= 5) {
		data_file = argv[4];
	}
	
	/* 加载数据 */
	ret = load_data(data_file, &stations, &n_sta, &lines, &n_line);
	if (ret != 0) {
		printf("{\"success\":false,\"message\":\"数据加载失败\"}");
		return -1;
	}
	
	/* 解析模式 */
	mode = atoi(argv[3]);
	if (mode < 1 || mode > 3) {
		printf("{\"success\":false,\"message\":\"模式无效，请输入1、2或3\"}");
		return -1;
	}
	
	/* 查找起点和终点 */
	start_id = find_station(argv[1], stations, n_sta);
	if (start_id == -1) {
		/* 尝试模糊匹配 */
		int matches[10];
		int match_count = fuzzy_match_stations(argv[1], stations, n_sta, matches, 10);
		if (match_count == 1) {
			start_id = matches[0];
		} else if (match_count > 1) {
			printf("{\"success\": false,\"message\":\"起点匹配到多个站点\",\"matches\":[");
			for (i = 0; i < match_count; i++) {
				printf("\"%s\"", stations[matches[i]].name);
				if (i < match_count - 1) printf(",");
			}
			printf("]}");
			goto cleanup;
		} else {
			printf("{\"success\":false,\"message\":\"未找到起点站\"}");
			goto cleanup;
		}
	}
	
	end_id = find_station(argv[2], stations, n_sta);
	if (end_id == -1) {
		int matches[10];
		int match_count = fuzzy_match_stations(argv[2], stations, n_sta, matches, 10);
		if (match_count == 1) {
			end_id = matches[0];
		} else if (match_count > 1) {
			printf("{\"success\":false,\"message\":\"终点匹配到多个站点\",\"matches\":[");
			for (i = 0; i < match_count; i++) {
				printf("\"%s\"", stations[matches[i]].name);
				if (i < match_count - 1) printf(",");
			}
			printf("]}");
			goto cleanup;
		} else {
			printf("{\"success\": false,\"message\":\"未找到终点站\"}");
			goto cleanup;
		}
	}
	
	if (start_id == end_id) {
		printf("{\"success\":false,\"message\":\"起点和终点相同\"}");
		goto cleanup;
	}
	
	/* 建立图 */
	g = adj_build_extended(stations, n_sta, lines, n_line, mode, start_id);
	
	/* 分配内存 */
	dist = (double *)malloc(sizeof(double) * g->n);
	pre = (int *)malloc(sizeof(int) * g->n);
	path = (int *)malloc(sizeof(int) * g->n);
	
	/* 运行Dijkstra */
	super_src = n_sta * n_line;
	dijkstra_double(g, super_src, dist, pre);
	
	/* 找最优终点状态 */
	min_cost = INF;
	end_state = -1;
	for (i = 0; i < n_line; i++) {
		int j;
		int on_line = 0;
		
		for (j = 0; j < lines[i].stop_cnt; j++) {
			if (lines[i].stops[j] == end_id) {
				on_line = 1;
				break;
			}
		}
		
		if (! on_line) continue;
		
		int state = end_id * n_line + i;
		if (dist[state] < min_cost) {
			min_cost = dist[state];
			end_state = state;
		}
	}
	
	if (min_cost >= INF) {
		printf("{\"success\":false,\"message\": \"未找到路径\"}");
	} else {
		/* 恢复路径 */
		path_len = recover_path(pre, super_src, end_state, path, g->n);
		
		/* 输出JSON */
		output_json(path, path_len, stations, lines, n_sta, n_line, min_cost, mode);
	}
	
	/* 释放资源 */
	free(dist);
	free(pre);
	free(path);
	adj_free(g);
	
cleanup:
	for (i = 0; i < n_line; i++) {
		free(lines[i].stops);
	}
	free(stations);
	free(lines);
	
	return 0;
}
