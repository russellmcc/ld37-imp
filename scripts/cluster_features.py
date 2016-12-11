import numpy as np
import numpy.random
import os
import sys
import json
import scipy.cluster

root = sys.argv[1]

all_features = np.zeros((225*20000, 96))

count = 0
for f in os.listdir(root):
    if not f.endswith('.features'):
        continue
    with open(os.path.join(sys.argv[1], f)) as data_file:
        data = json.load(data_file)
    all_features[225*count:225*(count+1)] = np.array(data)
    count += 1
    if count % 100 == 0:
        print count


num_codes = 2000
cluster_set_size = num_codes * 100
print "choosing cluster set!!"
cluster_set = all_features[numpy.random.random_integers(0, all_features.shape[0], cluster_set_size), :]

print "Commencing clustering!!"
codebook, distortion = scipy.cluster.vq.kmeans2(cluster_set, num_codes)
with open('src/hog-codebook.js', 'w') as codebook_file:
    codebook_file.write('export default function codebook() { return ')
    json.dump(codebook.tolist(), codebook_file)
    codebook_file.write(';}')